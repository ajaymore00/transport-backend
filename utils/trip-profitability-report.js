const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const costFields = ["fuelCost", "tollCost", "driverCost", "otherCost"];
const reportTimezoneOffsetMinutes = 330;

export function parseReportDateRange(startDate, endDate) {
  if (!dateOnlyPattern.test(startDate || "") || !dateOnlyPattern.test(endDate || "")) {
    throw new TypeError("Start date and end date must use YYYY-MM-DD format");
  }

  const startCalendarDate = new Date(`${startDate}T00:00:00.000Z`);
  const endCalendarDate = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(startCalendarDate.getTime()) || Number.isNaN(endCalendarDate.getTime()) ||
      startCalendarDate.toISOString().slice(0, 10) !== startDate ||
      endCalendarDate.toISOString().slice(0, 10) !== endDate) {
    throw new TypeError("Start date or end date is not a valid calendar date");
  }
  if (startDate > endDate) {
    throw new TypeError("Start date must be on or before end date");
  }

  const start = new Date(`${startDate}T00:00:00.000+05:30`);
  const endExclusive = new Date(`${endDate}T00:00:00.000+05:30`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

const numericValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatReportDate = (date) =>
  new Date(new Date(date).getTime() + reportTimezoneOffsetMinutes * 60 * 1000)
    .toISOString()
    .slice(0, 10);

export function buildTripProfitabilityReport(routes, startDate, endDate, expenses = []) {
  const trips = routes
    .filter((route) => route.status?.toLowerCase() !== "cancelled")
    .map((route) => {
      const costs = Object.fromEntries(costFields.map((field) => [field, numericValue(route[field])]));
      const totalCosts = costFields.reduce((total, field) => total + costs[field], 0);
      const revenue = numericValue(route.amount);
      return {
        id: route._id.toString(),
        routeNo: route.routeNo || "",
        routeName: route.routeName || "",
        startLocation: route.startLocation || "",
        endLocation: route.endLocation || "",
        date: formatReportDate(route.date),
        status: route.status || "Pending",
        distanceKm: numericValue(route.distanceKm),
        revenue,
        ...costs,
        totalCosts,
        profit: revenue - totalCosts,
      };
    });

  const totalRevenue = trips.reduce((total, trip) => total + trip.revenue, 0);
  const totalTripCosts = trips.reduce((total, trip) => total + trip.totalCosts, 0);
  const totalExpenses = expenses.reduce((total, expense) => total + numericValue(expense.amount), 0);
  const totalCosts = totalTripCosts + totalExpenses;
  const tripCostTotal = (field) => trips.reduce((total, trip) => total + trip[field], 0);

  return {
    startDate,
    endDate,
    tripCount: trips.length,
    totalRevenue,
    totalTripCosts,
    totalFuelCost: tripCostTotal("fuelCost"),
    totalTollCost: tripCostTotal("tollCost"),
    totalDriverCost: tripCostTotal("driverCost"),
    totalOtherCost: tripCostTotal("otherCost"),
    totalExpenses,
    totalCosts,
    totalProfit: totalRevenue - totalCosts,
    trips,
  };
}
