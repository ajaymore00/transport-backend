import express from "express";
import Vehicle from "../models/vehicle.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all vehicles for authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.userId });
    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET vehicle by ID for authenticated user
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// CREATE a new vehicle
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      model,
      type,
      driverName,
      registrationNo,
      driverContact,
      status,
      dateAdded,
      insuranceExpiry,
      mileage,
      capacity,
      color,
      year,
      manufacturer,
      createdDate,
      updatedDate,
      createdOn,
      updatedOn,
      createdBy,
      updatedBy,
    } = req.body;

    if (!name || !model || !type || !registrationNo || !capacity) {
      return res.status(400).json({ message: "Missing required vehicle fields" });
    }

    const existingVehicle = await Vehicle.findOne({ registrationNo });
    if (existingVehicle) {
      return res.status(409).json({ message: "Vehicle with this registration number already exists" });
    }

    const vehicle = new Vehicle({
      userId: req.user.userId,
      name,
      model,
      type,
      driverName,
      registrationNo,
      driverContact,
      status,
      dateAdded,
      insuranceExpiry,
      mileage,
      capacity,
      color,
      year,
      manufacturer,
      createdDate,
      updatedDate,
      createdOn: createdOn || new Date(),
      updatedOn: updatedOn || new Date(),
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE a vehicle by ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedOn: req.body.updatedOn || new Date(),
      updatedBy: req.user.userId,
    };
    const updatedVehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedVehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE a vehicle by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedVehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!deletedVehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;