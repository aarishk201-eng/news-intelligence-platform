import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'editor' | 'admin';
  avatar?: string;
  bio?: string;
  preferences: {
    categories: string[];
    sources: string[];
    language: string;
    darkMode: boolean;
    emailDigest: 'daily' | 'weekly' | 'never';
  };
  savedArticles: mongoose.Types.ObjectId[];
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  changedPasswordAfter(jwtTimestamp: number): boolean;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'editor', 'admin'],
      default: 'user',
    },
    avatar: { type: String },
    bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
    preferences: {
      categories: [{ type: String }],
      sources: [{ type: String }],
      language: { type: String, default: 'en' },
      darkMode: { type: Boolean, default: false },
      emailDigest: { type: String, enum: ['daily', 'weekly', 'never'], default: 'weekly' },
    },
    savedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ─── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ─── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { id: this._id, role: this.role },
    (process.env.JWT_SECRET ?? 'fallback_secret') as string,
    { expiresIn: (process.env.JWT_EXPIRE ?? '7d') as any }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id },
    (process.env.JWT_REFRESH_SECRET ?? 'fallback_refresh_secret') as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRE ?? '30d') as any }
  );
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor((this.passwordChangedAt as Date).getTime() / 1000);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
