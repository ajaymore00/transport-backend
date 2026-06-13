import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  userId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  driverName: { type: String, trim: true },
  registrationNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  driverContact: { type: String, trim: true },
  status: { type: String, trim: true, default: "Active" },
  dateAdded: { type: String, trim: true },
  insuranceExpiry: { type: String, trim: true },
  mileage: { type: String, trim: true },
  capacity: { type: String, trim: true },
  color: { type: String, trim: true },
  year: { type: String, trim: true },
  manufacturer: { type: String, trim: true },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  createdBy: { type: String, trim: true },
  updatedBy: { type: String, trim: true },
}, { timestamps: true });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);


export default Vehicle;