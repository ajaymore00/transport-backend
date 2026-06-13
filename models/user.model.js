import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const otpSchema = new mongoose.Schema({
  secret: { type: String, trim: true },
  expiresAt: { type: Date },
});

const userSchema = new mongoose.Schema(
  {
    transporterName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    userName: { type: String, trim: true },
    gstNo: { type: String, trim: true, uppercase: true },
    userId: { type: String, required: true, unique: true, default: () => randomUUID() },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    roleId: { type: Number, enum: [0, 1, 2], default: 1 },
    isVerified: { type: Boolean, default: false },
    signupOtp: otpSchema,
    resetOtp: otpSchema,
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdOn: { type: Date, default: Date.now },
    updatedOn: { type: Date, default: Date.now },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.updatedDate = new Date();
  next();
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
