import test from "node:test";
import assert from "node:assert/strict";
import { buildTripProfitabilityReport, parseReportDateRange } from "../utils/trip-profitability-report.js";

test("report date range includes the complete end date", () => {
  const range = parseReportDateRange("2026-11-01", "2026-11-30");

  assert.equal(range.start.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(range.endExclusive.toISOString(), "2026-11-30T18:30:00.000Z");
});

test("single-day report range covers the full calendar day in IST", () => {
  const range = parseReportDateRange("2026-11-01", "2026-11-01");

  assert.equal(range.start.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(range.endExclusive.toISOString(), "2026-11-01T18:30:00.000Z");
  assert.equal(new Date("2026-11-02T00:00:00.000Z") < range.endExclusive, false);
});

test("report date range rejects invalid and reversed dates", () => {
  assert.throws(() => parseReportDateRange("2026-02-30", "2026-03-01"), /valid calendar date/);
  assert.throws(() => parseReportDateRange("2026-11-02", "2026-11-01"), /on or before/);
  assert.throws(() => parseReportDateRange("01-11-2026", "2026-11-01"), /YYYY-MM-DD/);
});

test("profitability report includes expenses and excludes cancelled trips", () => {
  const report = buildTripProfitabilityReport([
    {
      _id: { toString: () => "trip-1" },
      routeNo: "RT-000001",
      routeName: "Pune to Mumbai",
      startLocation: "Pune",
      endLocation: "Mumbai",
      date: new Date("2026-11-03T08:00:00.000Z"),
      status: "Delivered",
      distanceKm: 150,
      amount: 10000,
      fuelCost: 2000,
      tollCost: 500,
      driverCost: 1000,
      otherCost: 250,
    },
    {
      _id: { toString: () => "trip-2" },
      date: new Date("2026-11-04T08:00:00.000Z"),
      status: "Cancelled",
      amount: 5000,
    },
  ], "2026-11-01", "2026-11-30", [
    { amount: 750 },
    { amount: 250 },
  ]);

  assert.equal(report.tripCount, 1);
  assert.equal(report.totalRevenue, 10000);
  assert.equal(report.totalTripCosts, 3750);
  assert.equal(report.totalFuelCost, 2000);
  assert.equal(report.totalTollCost, 500);
  assert.equal(report.totalDriverCost, 1000);
  assert.equal(report.totalOtherCost, 250);
  assert.equal(report.totalExpenses, 1000);
  assert.equal(report.totalCosts, 4750);
  assert.equal(report.totalProfit, 5250);
  assert.equal(report.trips[0].profit, 6250);
  assert.equal(report.trips[0].date, "2026-11-03");
});
