import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  projects: Schema.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
});

export default model<IUser>('User', userSchema);