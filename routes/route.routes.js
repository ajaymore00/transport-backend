import express from "express";
import Route from "../models/route.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
const editableRouteFields = [
  "routeName",
  "startLocation",
  "endLocation",
  "date",
  "startTime",
  "endTime",
  "driverName",
  "vehicleNumber",
  "status",
  "progress",
  "vendor",
  "cargoType",
  "loadWeight",
  "distanceKm",
  "amount",
  "fuelCost",
  "tollCost",
  "driverCost",
  "otherCost",
  "shipmentReference",
  "notes",
  "checkpoints",
];
const costFields = ["fuelCost", "tollCost", "driverCost", "otherCost"];

const getEditableRouteData = (body) => {
  const source = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  return Object.fromEntries(editableRouteFields
    .filter((field) => Object.hasOwn(source, field))
    .map((field) => [field, source[field]]));
};

const validateCosts = (data) => {
  for (const field of costFields) {
    if (data[field] === undefined) continue;
    const value = Number(data[field]);
    if (!Number.isFinite(value) || value < 0) {
      return `${field} must be a non-negative number`;
    }
    data[field] = value;
  }
  return null;
};

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
    const routeData = getEditableRouteData(req.body);
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: "Invalid route data" });
    }

    const costError = validateCosts(routeData);
    if (costError) return res.status(400).json({ message: costError });

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
      fuelCost,
      tollCost,
      driverCost,
      otherCost,
      shipmentReference,
      notes,
    } = routeData;

    if (!routeName || !startLocation || !endLocation || !date || !startTime || !endTime) {
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
      fuelCost,
      tollCost,
      driverCost,
      otherCost,
      shipmentReference,
      notes,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
    });

    const savedRoute = await route.save();
    res.status(201).json(savedRoute);
  } catch (error) {
    console.error("Error creating route:", error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid route data", errors: error.errors });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// UPDATE a route by ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updateData = getEditableRouteData(req.body);
    const costError = validateCosts(updateData);
    if (costError) return res.status(400).json({ message: costError });

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ message: "No editable route fields provided" });
    }

    Object.assign(updateData, {
      updatedDate: new Date(),
      updatedOn: new Date(),
      updatedBy: req.user.userId,
    });

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
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid route data", errors: error.errors });
    }
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
