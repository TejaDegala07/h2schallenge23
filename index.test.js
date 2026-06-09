"use strict";

/**
 * index.test.js — Jest Test Suite
 * Carbon Footprint Tracker — Hack2Skill PromptWars Challenge 3
 *
 * Requires the pure calculateEmissions function from app.js.
 */

const { calculateEmissions } = require("./app.js");

describe("calculateEmissions(distance, coefficient)", () => {

  // Test 1 — Car
  test("Test 1: calculates correct emissions for a Car (distance * 0.24)", () => {
    expect(calculateEmissions(10, 0.24)).toBe(2.4);
  });

  // Test 2 — Bus
  test("Test 2: calculates correct emissions for a Bus (distance * 0.08)", () => {
    expect(calculateEmissions(10, 0.08)).toBe(0.8);
  });

  // Test 3 — Bike / Walk (zero coefficient)
  test("Test 3: calculates correct emissions for Bike/Walk (distance * 0.00 = 0)", () => {
    expect(calculateEmissions(10, 0.00)).toBe(0);
  });

  // Test 4 — Negative distance must return null
  test("Test 4 (Edge Case): negative distance returns null", () => {
    expect(calculateEmissions(-5, 0.24)).toBeNull();
  });

  // Test 5 — String injection returns null
  test("Test 5 (Security): string input for distance returns null", () => {
    expect(calculateEmissions("<script>alert(1)</script>", 0.24)).toBeNull();
  });

  // Test 6 — Empty / undefined returns null
  test("Test 6 (Validation): undefined distance returns null", () => {
    expect(calculateEmissions(undefined, 0.24)).toBeNull();
  });

  // Test 7 — NaN returns null
  test("Test 7 (Validation): NaN distance returns null", () => {
    expect(calculateEmissions(NaN, 0.24)).toBeNull();
  });

  // Test 8 — Infinity returns null
  test("Test 8 (Validation): Infinity distance returns null", () => {
    expect(calculateEmissions(Infinity, 0.24)).toBeNull();
  });

  // Test 9 — Zero distance is valid and returns 0
  test("Test 9 (Edge Case): zero distance is valid and returns 0", () => {
    expect(calculateEmissions(0, 0.24)).toBe(0);
  });

  // Test 10 — Negative coefficient returns null
  test("Test 10 (Validation): negative coefficient returns null", () => {
    expect(calculateEmissions(10, -0.5)).toBeNull();
  });

});
