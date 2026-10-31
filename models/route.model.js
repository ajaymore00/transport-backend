import mongoose from "mongoose";

const checkpointSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  driverStatus: { type: String, trim: true, default: "Pending" },
  reached: { type: Boolean, default: false },
  updatedOn: { type: String, trim: true },
  remarks: { type: String, trim: true },
});

const routeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true },
    routeId: { type: Number, unique: true, sparse: true },
    routeNo: { type: String, required: true, unique: true, trim: true },
    routeName: { type: String, required: true, trim: true },
    startLocation: { type: String, required: true, trim: true },
    endLocation: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    driverName: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    status: { type: String, trim: true, default: "Pending" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    vendor: { type: String, trim: true },
    cargoType: { type: String, trim: true },
    loadWeight: { type: String, trim: true },
    distanceKm: { type: Number, min: 0 },
    amount: { type: Number, min: 0 },
    shipmentReference: { type: String, trim: true },
    notes: { type: String, trim: true },
    checkpoints: { type: [checkpointSchema], default: [] },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdOn: { type: Date, default: Date.now },
    updatedOn: { type: Date, default: Date.now },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

const Route = mongoose.model("Route", routeSchema);

export default Route;
