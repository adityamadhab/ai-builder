import { Schema, model, Document } from 'mongoose';
import { CodeFile } from '../types/index';

export interface IProject extends Document {
  name: string;
  owner: Schema.Types.ObjectId;
  frontend: CodeFile[];
  backend: CodeFile[];
  adminPanel: CodeFile[];
}

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  frontend: [{
    path: String,
    code: String
  }],
  backend: [{
    path: String,
    code: String
  }],
  adminPanel: [{
    path: String,
    code: String
  }]
});

export default model<IProject>('Project', projectSchema);