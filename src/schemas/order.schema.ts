import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class StudentInfo {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  email: string;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true })
  school_id: string;

  @Prop()
  trustee_id?: string;

  @Prop({ type: StudentInfo })
  student_info?: StudentInfo;

  @Prop({ required: true })
  gateway_name: string;

  @Prop()
  custom_order_id?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ custom_order_id: 1 });
OrderSchema.index({ school_id: 1 });
