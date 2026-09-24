import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IBlock extends Document {
  type: 'single' | 'recurring';
  professional?: Types.ObjectId | null;
  reason?: string;
  active: boolean;

  startDateTime?: Date;
  endDateTime?: Date;

  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  validFrom?: Date;
  validUntil?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const blockSchema = new Schema<IBlock>(
  {
    type: { type: String, enum: ['single', 'recurring'], required: true },
    professional: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, trim: true },
    active: { type: Boolean, default: true },

    startDateTime: { type: Date },
    endDateTime: { type: Date },

    daysOfWeek: {
      type: [Number],
      validate: {
        validator: (v: number[]) => v.every((d) => d >= 0 && d <= 6),
        message: 'daysOfWeek deve conter valores entre 0 e 6',
      },
    },
    startTime: { type: String, match: timeRegex },
    endTime: { type: String, match: timeRegex },
    validFrom: { type: Date },
    validUntil: { type: Date },
  },
  { timestamps: true }
);

blockSchema.index({ professional: 1, active: 1 });

blockSchema.pre('validate', function (next) {
  if (this.type === 'single' && (!this.startDateTime || !this.endDateTime)) {
    return next(new Error('Bloqueio único requer startDateTime e endDateTime'));
  }
  if (
    this.type === 'recurring' &&
    (!this.daysOfWeek || this.daysOfWeek.length === 0 || !this.startTime || !this.endTime)
  ) {
    return next(new Error('Bloqueio recorrente requer daysOfWeek (com ao menos um dia), startTime e endTime'));
  }
  next();
});

const Block: Model<IBlock> = mongoose.model<IBlock>('Block', blockSchema);

export default Block;
