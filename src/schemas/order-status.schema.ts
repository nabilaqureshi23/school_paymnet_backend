import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class OrderStatus extends Document {
  @Prop({ type: String, required: true })
  collect_id: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderRef?: Types.ObjectId;

  @Prop({ required: true })
  order_amount: number;

  @Prop()
  transaction_amount?: number;

  @Prop()
  payment_mode?: string;

  @Prop()
  payment_details?: string;

  @Prop()
  bank_reference?: string;

  @Prop()
  payment_message?: string;

  @Prop({ default: 'initiated' })
  status: string;

  @Prop()
  error_message?: string;

  @Prop()
  payment_time?: Date;
}

export const OrderStatusSchema = SchemaFactory.createForClass(OrderStatus);
OrderStatusSchema.index({ collect_id: 1 });
OrderStatusSchema.index({ orderRef: 1 });
OrderStatusSchema.index({ payment_time: -1 });
