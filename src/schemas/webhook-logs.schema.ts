import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WebhookLogs extends Document {
  @Prop({ type: Object, required: true })
  webhook_data: Record<string, any>;

  @Prop({ required: true })
  status_code: number;

  @Prop()
  order_id?: string;

  @Prop()
  processed_at?: Date;

  @Prop()
  error_message?: string;
}

export const WebhookLogsSchema = SchemaFactory.createForClass(WebhookLogs);
