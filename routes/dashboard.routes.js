import express from "express";
import Driver from "../models/driver.model.js";
import Expense from "../models/expense.model.js";
import Route from "../models/route.model.js";
import Vehicle from "../models/vehicle.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

const formatDate = (date) => date.toISOString().slice(0, 10);

router.get("/", authMiddleware, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    const userId = req.user.userId;

    const [todayRoutes, futureRoutes, vehicles, expenses, drivers] = await Promise.all([
      Route.find({ userId, date: { $gte: todayStart, $lt: tomorrowStart } })
        .select("_id startLocation endLocation startTime status")
        .sort({ startTime: 1 })
        .lean(),
      Route.find({ userId, date: { $gte: tomorrowStart } })
        .select("_id startLocation endLocation date")
        .sort({ date: 1 })
        .lean(),
      Vehicle.find({ userId }).select("_id name type status").sort({ createdDate: -1 }).lean(),
      Expense.find({ userId }).select("_id type amount date").sort({ date: -1 }).lean(),
      Driver.find({ userId }).select("_id name contact").sort({ createdDate: -1 }).lean(),
    ]);

    return res.status(200).json({
      todayRoutes: todayRoutes.map((route) => ({
        id: route._id.toString(),
        route: `${route.startLocation} → ${route.endLocation}`,
        time: route.startTime,
        status: route.status,
      })),
      futureRoutes: futureRoutes.map((route) => ({
        id: route._id.toString(),
        route: `${route.startLocation} → ${route.endLocation}`,
        date: formatDate(route.date),
      })),
      vehicles: vehicles.map((vehicle) => ({
        id: vehicle._id.toString(),
        name: vehicle.name,
        type: vehicle.type,
        status: vehicle.status,
      })),
      expenses: expenses.map((expense) => ({
        id: expense._id.toString(),
        type: expense.type,
        amount: expense.amount,
        date: formatDate(expense.date),
      })),
      drivers: drivers.map((driver) => ({
        id: driver._id.toString(),
        name: driver.name,
        contact: driver.contact,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
