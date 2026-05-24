import express from "express";
import Vehicle from "../models/vehicle.model.js";

const router = express.Router();

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// CREATE a new vehicle
router.post("/", async (req, res) => {
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
      createdBy,
      updatedBy,
    });

    const savedVehicle = await vehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE a vehicle by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
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
router.delete("/:id", async (req, res) => {
  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deletedVehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;