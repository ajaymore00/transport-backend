import express from "express";
import Route from "../models/route.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET all routes for authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const routes = await Route.find({ userId: req.user.userId });
    res.status(200).json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET route by ID for authenticated user
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.status(200).json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const generateNextRouteSequence = async () => {
  const lastRoute = await Route.findOne({ routeNo: /^RT-\d{6}$/ })
    .sort({ routeId: -1, routeNo: -1 })
    .lean();

  let nextNumber = 1;
  if (lastRoute) {
    const match = lastRoute.routeNo?.match(/^RT-(\d{6})$/);
    if (match) {
      nextNumber = Number(match[1]) + 1;
    } else if (typeof lastRoute.routeId === "number") {
      nextNumber = lastRoute.routeId + 1;
    }
  }

  return {
    routeId: nextNumber,
    routeNo: `RT-${String(nextNumber).padStart(6, "0")}`,
  };
};

// CREATE a new route
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      routeName,
      startLocation,
      endLocation,
      date,
      startTime,
      endTime,
      driverName,
      vehicleNumber,
      status,
      progress,
      checkpoints,
      vendor,
      cargoType,
      loadWeight,
      distanceKm,
      amount,
      shipmentReference,
      notes,
      createdDate,
      updatedDate,
      createdOn,
      updatedOn,
    } = req.body;

    if (!routeName || !startLocation || !endLocation || !date || !time) {
      return res.status(400).json({ message: "Missing required route fields" });
    }

    const { routeId, routeNo } = await generateNextRouteSequence();

    const route = new Route({
      userId: req.user.userId,
      routeId,
      routeNo,
      routeName,
      startLocation,
      endLocation,
      date,
      startTime,
      endTime,
      driverName,
      vehicleNumber,
      status,
      progress,
      checkpoints,
      vendor,
      cargoType,
      loadWeight,
      distanceKm,
      amount,
      shipmentReference,
      notes,
      createdDate,
      updatedDate,
      createdOn: createdOn || new Date(),
      updatedOn: updatedOn || new Date(),
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const savedRoute = await route.save();
    res.status(201).json(savedRoute);
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE a route by ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedDate: req.body.updatedDate || new Date(),
      updatedOn: req.body.updatedOn || new Date(),
      updatedBy: req.user.userId,
    };

    const updatedRoute = await Route.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedRoute) return res.status(404).json({ message: "Route not found" });
    res.status(200).json(updatedRoute);
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE a route by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedRoute = await Route.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!deletedRoute) return res.status(404).json({ message: "Route not found" });
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
