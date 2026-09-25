import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAppointment extends Document {
  client: Types.ObjectId;
  professional: Types.ObjectId;
  product: Types.ObjectId;
  startDateTime: Date;
  endDateTime: Date;
  status: 'scheduled' | 'cancelled';
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    professional: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'cancelled'], default: 'scheduled' },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ professional: 1, status: 1, startDateTime: 1 });
appointmentSchema.index({ client: 1, startDateTime: -1 });

appointmentSchema.pre('validate', function (next) {
  if (this.startDateTime && this.endDateTime && this.endDateTime <= this.startDateTime) {
    return next(new Error('endDateTime deve ser posterior a startDateTime'));
  }
  next();
});

const Appointment: Model<IAppointment> = mongoose.model<IAppointment>('Appointment', appointmentSchema);

export default Appointment;
