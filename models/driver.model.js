import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  userId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  licenseNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  contact: { type: String, required: true, trim: true },
  experience: { type: Number, default: 0, min: 0 },
  address: { type: String, trim: true },
  salary: { type: Number, min: 0 },
  joiningDate: { type: Date },
  dateAdded: { type: Date, default: Date.now },
  status: { type: String, trim: true, default: "Available" },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true },
}, { timestamps: true });

const Driver = mongoose.model("Driver", driverSchema);

export default Driver;
