import express from "express";
import Driver from "../models/driver.model.js";

const router = express.Router();

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET driver by ID
router.get("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    res.status(200).json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// CREATE a new driver
router.post("/", async (req, res) => {
  try {
    const {
      name,
      licenseNo,
      contact,
      experience,
      address,
      salary,
      joiningDate,
      dateAdded,
      status,
      createdDate,
      updatedDate,
      createdBy,
      updatedBy,
    } = req.body;

    if (!name || !licenseNo || !contact) {
      return res.status(400).json({ message: "Missing required driver fields" });
    }

    const existingDriver = await Driver.findOne({ licenseNo });
    if (existingDriver) {
      return res.status(409).json({ message: "Driver with this license number already exists" });
    }

    const driver = new Driver({
      name,
      licenseNo,
      contact,
      experience,
      address,
      salary,
      joiningDate,
      dateAdded,
      status,
      createdDate,
      updatedDate,
      createdBy,
      updatedBy,
    });

    const savedDriver = await driver.save();
    res.status(201).json(savedDriver);
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE a driver by ID
router.put("/:id", async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedDate: req.body.updatedDate || new Date(),
    };

    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDriver) return res.status(404).json({ message: "Driver not found" });
    res.status(200).json(updatedDriver);
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE a driver by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedDriver = await Driver.findByIdAndDelete(req.params.id);
    if (!deletedDriver) return res.status(404).json({ message: "Driver not found" });
    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
