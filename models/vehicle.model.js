import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true, uppercase: true },
  capacity: { type: Number, required: true, min: 0 },
}, { timestamps: true });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;