import test from "node:test";
import assert from "node:assert/strict";
import Route from "../models/route.model.js";

const routeData = {
  userId: "test-user",
  routeNo: "RT-999999",
  routeName: "Pune to Mumbai",
  startLocation: "Pune",
  endLocation: "Mumbai",
  date: new Date("2026-11-01T00:00:00.000Z"),
  startTime: "09:00 AM",
  endTime: "05:00 PM",
};

test("trip costs default to zero and are persisted in the route schema", () => {
  const route = new Route(routeData);

  assert.equal(route.fuelCost, 0);
  assert.equal(route.tollCost, 0);
  assert.equal(route.driverCost, 0);
  assert.equal(route.otherCost, 0);
});

test("trip costs accept non-negative values", () => {
  const route = new Route({
    ...routeData,
    fuelCost: 1250,
    tollCost: 300,
    driverCost: 500,
    otherCost: 75,
  });

  assert.equal(route.validateSync(), undefined);
});

test("trip costs reject negative values", () => {
  const route = new Route({ ...routeData, fuelCost: -1 });
  const error = route.validateSync();

  assert.ok(error);
  assert.ok(error.errors.fuelCost);
});
