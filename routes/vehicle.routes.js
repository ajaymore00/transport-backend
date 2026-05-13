import express from "express";
import Vehicle from "../models/vehicle.model.js"; // Ensure the model is imported correctly

const router = express.Router();

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find(); // Fetch all vehicles from the database
    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;