// import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
// import { PaymentService } from '../services/payment.service';

// @Controller()
// export class PaymentController {
//   constructor(private paymentService: PaymentService) {}
  
//   @Post('create-payment')
//   async createPayment(@Body() paymentData: any) {
//     return await this.paymentService.createPayment(paymentData);
//   }

//   @Post('webhook')
//   async handleWebhook(@Body() webhookData: any) {
//     return await this.paymentService.handleWebhook(webhookData);
//   }

//   @Get('transactions')
//   async getAllTransactions(
//     @Query('page') page: number = 1,
//     @Query('limit') limit: number = 10,
//   ) {
//     return {
//       message: 'Get all transactions endpoint (will implement with database)',
//       page,
//       limit
//     };
//   }

//   @Get('transactions/school/:schoolId')
//   async getTransactionsBySchool(@Param('schoolId') schoolId: string) {
//     return {
//       message: 'Get transactions by school (will implement with database)',
//       schoolId
//     };
//   }

//   @Get('transaction-status/:custom_order_id')
//   async getTransactionStatus(@Param('custom_order_id') customOrderId: string) {
//     return await this.paymentService.checkPaymentStatus(customOrderId);
//   }
// }


import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createPayment(@Body() paymentData: CreatePaymentDto) {
    return await this.paymentService.createPayment(paymentData);
  }

  @Post('webhook')
  async handleWebhook(@Body() webhookData: any) {
    return await this.paymentService.handleWebhook(webhookData);
  }

  @Get('status/:id')
  async checkStatus(@Param('id') id: string) {
    return this.paymentService.checkPaymentStatus(id);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getAllTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'payment_time',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    return await this.paymentService.getAllTransactions({
      page: Number(page),
      limit: Number(limit),
      sort,
      order,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions/school/:schoolId')
  async getTransactionsBySchool(
    @Param('schoolId') schoolId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'payment_time',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    return await this.paymentService.getTransactionsBySchool(schoolId, {
      page: Number(page),
      limit: Number(limit),
      sort,
      order,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('transaction-status/:id')
  async getTransactionStatus(@Param('id') id: string) {
    return await this.paymentService.checkPaymentStatus(id);
  }
}
