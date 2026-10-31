import express from "express";
import Expense from "../models/expense.model.js";
import Route from "../models/route.model.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { buildTripProfitabilityReport, parseReportDateRange } from "../utils/trip-profitability-report.js";

const router = express.Router();

router.get("/trip-profitability", authMiddleware, async (req, res) => {
  let dateRange;
  try {
    dateRange = parseReportDateRange(req.query.startDate, req.query.endDate);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const [routes, expenses] = await Promise.all([
      Route.find({
        userId: req.user.userId,
        date: { $gte: dateRange.start, $lt: dateRange.endExclusive },
      })
        .select("_id routeNo routeName startLocation endLocation date status distanceKm amount fuelCost tollCost driverCost otherCost")
        .sort({ date: -1, routeNo: 1 })
        .lean(),
      Expense.find({
        userId: req.user.userId,
        date: { $gte: dateRange.start, $lt: dateRange.endExclusive },
      })
        .select("amount") 
        .lean(),
    ]);

    return res.status(200).json(
      buildTripProfitabilityReport(routes, req.query.startDate, req.query.endDate, expenses),
    );
  } catch (error) {
    console.error("Error generating trip profitability report:", error);
    return res.status(500).json({ message: "Unable to generate report" });
  }
});

export default router;
