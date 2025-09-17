import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

import { Order } from '../schemas/order.schema';
import { OrderStatus } from '../schemas/order-status.schema';
import { WebhookLogs } from '../schemas/webhook-logs.schema';

// DTOs for strong typing
export interface CreatePaymentDto {
  school_id: string;
  amount: number | string;
  student_info?: any;
  trustee_id?: string;
  custom_order_id?: string;
  callback_url?: string;
}

export interface WebhookDto {
  status?: number;
  order_info?: {
    order_id?: string;
    order_amount?: number;
    transaction_amount?: number;
    payment_mode?: string;
    payment_details?: string;
    bank_reference?: string;
    payment_message?: string;
    status?: string;
    payment_time?: string;
    error_message?: string;
  };
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly API_BASE_URL: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(OrderStatus.name) private readonly orderStatusModel: Model<OrderStatus>,
    @InjectModel(WebhookLogs.name) private readonly webhookLogsModel: Model<WebhookLogs>,
  ) {
    // ✅ Assign base URL from env or fallback
    this.API_BASE_URL =
      this.configService.get<string>('PAYMENT_API_BASE_URL') ||
      'https://dev-vanilla.edviron.com/erp';
  }

  /**
   * Create a new payment request
   */
  async createPayment(paymentData: CreatePaymentDto) {
  try {
    const {
      school_id,
      amount: rawAmount,
      student_info = {},
      trustee_id = '',
      custom_order_id,
      callback_url = this.configService.get<string>('DEFAULT_CALLBACK_URL') || 'https://google.com',
    } = paymentData;

    if (!school_id || !rawAmount) {
      this.logger.warn('Missing school_id or amount in createPayment');
      return { success: false, message: 'school_id and amount are required' };
    }

    const amount = String(rawAmount);

    // 1. Save Order
    const orderDoc = await this.orderModel.create({
      school_id,
      trustee_id,
      student_info,
      gateway_name: 'Edviron',
      custom_order_id,
    });

    // 2. JWT Sign
    const pgKey = this.configService.get<string>('PG_KEY');
    if (!pgKey) throw new Error('PG_KEY not configured');

    const signPayload = { school_id, amount, callback_url };
    const sign = jwt.sign(signPayload, pgKey);

    const requestBody = { school_id, amount, callback_url, sign };

    // 3. Call Payment API
    const apiKey = this.configService.get<string>('API_KEY');
    if (!apiKey) throw new Error('API_KEY not configured');

    const resp = await axios.post(
      `${this.API_BASE_URL}/create-collect-request`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 10000,
      },
    );

    const respData = resp.data || {};
    this.logger.debug(`Payment API response: ${JSON.stringify(respData)}`);

    const collectId =
      respData.collect_request_id ||
      respData.collect_id ||
      respData.order_id ||
      null;

    // ✅ Handle multiple possible key names for payment URL
    const paymentUrl =
      respData.collect_request_url ||    // snake_case
      respData.Collect_request_url ||    // PascalCase
      respData.payment_url ||            // generic
      respData.redirect_url ||           // fallback
      null;

    // 4. Save OrderStatus
    await this.orderStatusModel.create({
      collect_id: collectId,
      orderRef: orderDoc._id,
      order_amount: Number(amount),
      transaction_amount: 0,
      status: 'Pending',
    });

    return {
      success: true,
      collect_request_id: collectId,
      payment_url: paymentUrl,
      message: paymentUrl
        ? 'Payment link created successfully'
        : 'Payment created, but no payment_url returned from API',
    };
  } catch (error) {
    this.logger.error('createPayment error', error?.response?.data || error.message);
    return {
      success: false,
      message: 'Failed to create payment link',
      details: error?.response?.data || error.message,
    };
  }
}


  /**
   * Handle webhook: save payload + update transaction status
   */
  async handleWebhook(webhookData: WebhookDto) {
    try {
      this.logger.log('Webhook received');

      // Save raw webhook
      await this.webhookLogsModel.create({
        webhook_data: webhookData,
        status_code: webhookData?.status ?? 0,
        order_id: webhookData?.order_info?.order_id ?? null,
        processed_at: new Date(),
      });

      const info = webhookData?.order_info;
      if (!info || !info.order_id) {
        this.logger.warn('Invalid webhook payload');
        return { success: false, message: 'Invalid webhook payload' };
      }

      const collectId = info.order_id;

      const updatePayload: any = {
        order_amount: info.order_amount,
        transaction_amount: info.transaction_amount,
        payment_mode: info.payment_mode,
        payment_details: info.payment_details,
        bank_reference: info.bank_reference,
        payment_message: info.payment_message,
        status: info.status,
        payment_time: info.payment_time ? new Date(info.payment_time) : undefined,
        error_message: info.error_message,
      };

      const updated = await this.orderStatusModel.findOneAndUpdate(
        { collect_id: collectId },
        { $set: updatePayload },
        { new: true, upsert: true },
      );

      this.logger.log(`Webhook processed for collect_id=${collectId}`);
      return { success: true, updated };
    } catch (error) {
      this.logger.error('handleWebhook error', error.message);
      return { success: false, message: 'Webhook processing failed', details: error.message };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(id: string) {
    try {
      // 1. Try local DB
      const order = await this.orderModel.findOne({ custom_order_id: id });
      if (order) {
        const status = await this.orderStatusModel
          .find({ orderRef: order._id })
          .sort({ payment_time: -1 })
          .limit(1)
          .lean();
        return { success: true, source: 'db', status: status[0] ?? null };
      }

      // 2. Fallback: call external API
      const schoolId = this.configService.get<string>('SCHOOL_ID');
      const pgKey = this.configService.get<string>('PG_KEY');
      if (!schoolId || !pgKey) throw new Error('Missing SCHOOL_ID or PG_KEY');

      const sign = jwt.sign({ school_id: schoolId, collect_request_id: id }, pgKey);

      const resp = await axios.get(`${this.API_BASE_URL}/collect-request/${id}`, {
        params: { school_id: schoolId, sign },
        timeout: 10000,
      });

      return { success: true, source: 'remote', data: resp.data };
    } catch (error) {
      this.logger.error('checkPaymentStatus error', error.message);
      return { success: false, message: 'Failed to check payment status', details: error.message };
    }
  }

  /**
   * Helper: build aggregation pipeline
   */
  private buildTransactionPipeline(
    options: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' },
    schoolId?: string,
  ): PipelineStage[] {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const sortField = options?.sort ?? 'payment_time';
    const order = options?.order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'orders',
          localField: 'orderRef',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
    ];

    if (schoolId) {
      pipeline.push({ $match: { 'order.school_id': schoolId } });
    }

    pipeline.push(
      {
        $project: {
          collect_id: 1,
          order_amount: 1,
          transaction_amount: 1,
          status: 1,
          payment_time: 1,
          'order.school_id': 1,
          'order.custom_order_id': 1,
          'order.gateway_name': 1,
        },
      },
      { $sort: { [sortField]: order } },
      { $skip: skip },
      { $limit: limit },
    );

    return pipeline;
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(options?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }) {
    const pipeline = this.buildTransactionPipeline(options || {});
    const data = await this.orderStatusModel.aggregate(pipeline).exec();

    return { success: true, page: options?.page ?? 1, limit: options?.limit ?? 10, data };
  }

  /**
   * Get transactions by school_id
   */
  async getTransactionsBySchool(
    schoolId: string,
    options?: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' },
  ) {
    const pipeline = this.buildTransactionPipeline(options || {}, schoolId);
    const data = await this.orderStatusModel.aggregate(pipeline).exec();

    return { success: true, page: options?.page ?? 1, limit: options?.limit ?? 10, data };
  }
}
