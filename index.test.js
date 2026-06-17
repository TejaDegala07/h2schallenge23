/**
 * @jest-environment jsdom
 */

"use strict";

const { calculateEmissions, handleFormSubmit, buildInsights, initializeApp } = require("./app.js");

describe("calculateEmissions - Symmetrical Guard Testing", () => {
  describe("Invalid distance arguments (with valid coefficient)", () => {
    test("string distance returns null", () => { expect(calculateEmissions("10", 0.24)).toBeNull(); });
    test("empty string distance returns null", () => { expect(calculateEmissions("", 0.24)).toBeNull(); });
    test("alphabetic string distance returns null", () => { expect(calculateEmissions("abc", 0.24)).toBeNull(); });
    test("null distance returns null", () => { expect(calculateEmissions(null, 0.24)).toBeNull(); });
    test("undefined distance returns null", () => { expect(calculateEmissions(undefined, 0.24)).toBeNull(); });
    test("boolean true distance returns null", () => { expect(calculateEmissions(true, 0.24)).toBeNull(); });
    test("boolean false distance returns null", () => { expect(calculateEmissions(false, 0.24)).toBeNull(); });
    test("object distance returns null", () => { expect(calculateEmissions({}, 0.24)).toBeNull(); });
    test("array distance returns null", () => { expect(calculateEmissions([], 0.24)).toBeNull(); });
    test("function distance returns null", () => { expect(calculateEmissions(() => {}, 0.24)).toBeNull(); });
    test("NaN distance returns null", () => { expect(calculateEmissions(NaN, 0.24)).toBeNull(); });
    test("Infinity distance returns null", () => { expect(calculateEmissions(Infinity, 0.24)).toBeNull(); });
    test("-Infinity distance returns null", () => { expect(calculateEmissions(-Infinity, 0.24)).toBeNull(); });
    test("negative distance returns null", () => { expect(calculateEmissions(-5, 0.24)).toBeNull(); });
  });

  describe("Invalid coefficient arguments (with valid distance)", () => {
    test("string coefficient returns null", () => { expect(calculateEmissions(10, "0.24")).toBeNull(); });
    test("empty string coefficient returns null", () => { expect(calculateEmissions(10, "")).toBeNull(); });
    test("alphabetic string coefficient returns null", () => { expect(calculateEmissions(10, "abc")).toBeNull(); });
    test("null coefficient returns null", () => { expect(calculateEmissions(10, null)).toBeNull(); });
    test("undefined coefficient returns null", () => { expect(calculateEmissions(10, undefined)).toBeNull(); });
    test("boolean true coefficient returns null", () => { expect(calculateEmissions(10, true)).toBeNull(); });
    test("boolean false coefficient returns null", () => { expect(calculateEmissions(10, false)).toBeNull(); });
    test("object coefficient returns null", () => { expect(calculateEmissions(10, {})).toBeNull(); });
    test("array coefficient returns null", () => { expect(calculateEmissions(10, [])).toBeNull(); });
    test("function coefficient returns null", () => { expect(calculateEmissions(10, () => {})).toBeNull(); });
    test("NaN coefficient returns null", () => { expect(calculateEmissions(10, NaN)).toBeNull(); });
    test("Infinity coefficient returns null", () => { expect(calculateEmissions(10, Infinity)).toBeNull(); });
    test("-Infinity coefficient returns null", () => { expect(calculateEmissions(10, -Infinity)).toBeNull(); });
    test("negative coefficient returns null", () => { expect(calculateEmissions(10, -0.5)).toBeNull(); });
  });

  describe("Both arguments invalid", () => {
    test("both null returns null", () => { expect(calculateEmissions(null, null)).toBeNull(); });
    test("both strings returns null", () => { expect(calculateEmissions("10", "0.24")).toBeNull(); });
  });
});

describe("calculateEmissions - Decimal Boundary and Valid Output Testing", () => {
  test("zero distance and valid coefficient returns 0", () => { expect(calculateEmissions(0, 0.24)).toBe(0); });
  test("valid distance and zero coefficient returns 0", () => { expect(calculateEmissions(10, 0)).toBe(0); });
  test("car emission calculation: 10 km × 0.24 = 2.4", () => { expect(calculateEmissions(10, 0.24)).toBe(2.4); });
  test("bus emission calculation: 10 km × 0.08 = 0.8", () => { expect(calculateEmissions(10, 0.08)).toBe(0.8); });
  test("decimal precision: 3.333 km × 0.24 = 0.80", () => { expect(calculateEmissions(3.333, 0.24)).toBe(0.8); });
  test("decimal precision: 7.5 km × 0.08 = 0.60", () => { expect(calculateEmissions(7.5, 0.08)).toBe(0.6); });
  test("IEEE 754 precision boundary: 1.005 km × 1.00 = 1.00", () => { expect(calculateEmissions(1.005, 1.00)).toBe(1.00); });
  test("fractional distance rounding: 1.23456 km × 0.24 = 0.30", () => { expect(calculateEmissions(1.23456, 0.24)).toBe(0.3); });
  test("high precision coefficients: 15 km × 0.123456 = 1.85", () => { expect(calculateEmissions(15, 0.123456)).toBe(1.85); });
});

describe("buildInsights Engine Testing", () => {
  test("returns car commuting tips for car and distance > 10", () => {
    const tips = buildInsights("car", 15);
    expect(tips[0]).toContain("heavy carbon load");
    expect(tips[1]).toContain("Smooth acceleration");
  });
  test("returns default active transport tips for car and distance <= 10", () => {
    const tips = buildInsights("car", 5);
    expect(tips[0]).toContain("zero-emission profile");
  });
  test("returns shared public transit tips for bus", () => {
    const tips = buildInsights("bus", 15);
    expect(tips[0]).toContain("shared public transport");
  });
});

describe("DOM Controller Architecture", () => {
  let elements;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="footprint-form">
        <div id="transport-selector">
          <button type="button" id="btn-car" class="transport-btn" data-type="car" data-coeff="0.24" aria-checked="false"></button>
          <button type="button" id="btn-bus" class="transport-btn" data-type="bus" data-coeff="0.08" aria-checked="false"></button>
          <button type="button" id="btn-bike" class="transport-btn" data-type="bike" data-coeff="0.00" aria-checked="false"></button>
        </div>
        <p id="transport-error" class="hidden"></p>
        
        <input type="number" id="distance-input" value="">
        <p id="distance-error" class="hidden"></p>
        
        <button type="submit" id="calculate-btn"></button>
      </form>
      
      <div id="result-box" class="hidden">
        <span id="emissions-output">0.00</span>
        <ul id="insights-list"></ul>
      </div>
      
      <div id="sr-announcer"></div>
    `;

    elements = {
      form: document.getElementById("footprint-form"),
      transportBtns: document.querySelectorAll(".transport-btn"),
      distanceInput: document.getElementById("distance-input"),
      resultBox: document.getElementById("result-box"),
      emissionsOut: document.getElementById("emissions-output"),
      insightsList: document.getElementById("insights-list"),
      announcer: document.getElementById("sr-announcer"),
      transportErr: document.getElementById("transport-error"),
      distanceErr: document.getElementById("distance-error"),
    };
  });

  test("Submitting the form with valid metrics updates emissions output and insights list", () => {
    const carBtn = document.getElementById("btn-car");
    carBtn.setAttribute("aria-checked", "true");
    elements.distanceInput.value = "15";
    const event = { preventDefault: jest.fn() };
    handleFormSubmit(event, elements);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(elements.emissionsOut.textContent).toBe("3.60");
    expect(elements.resultBox.classList.contains("hidden")).toBe(false);
    expect(elements.insightsList.children.length).toBeGreaterThan(0);
    expect(elements.announcer.textContent).toContain("3.60");
  });

  test("Submitting the form with missing transport parameters cleanly triggers transport error", () => {
    elements.distanceInput.value = "15";
    const event = { preventDefault: jest.fn() };
    handleFormSubmit(event, elements);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(elements.transportErr.classList.contains("hidden")).toBe(false);
  });

  test("Submitting the form with negative or empty distance inputs triggers distance error and aria-invalid", () => {
    const carBtn = document.getElementById("btn-car");
    carBtn.setAttribute("aria-checked", "true");
    elements.distanceInput.value = "";
    const event1 = { preventDefault: jest.fn() };
    handleFormSubmit(event1, elements);
    expect(elements.distanceErr.classList.contains("hidden")).toBe(false);
    expect(elements.distanceInput.getAttribute("aria-invalid")).toBe("true");

    elements.distanceInput.value = "-5";
    const event2 = { preventDefault: jest.fn() };
    handleFormSubmit(event2, elements);
    expect(elements.distanceErr.classList.contains("hidden")).toBe(false);
    expect(elements.distanceInput.getAttribute("aria-invalid")).toBe("true");
  });

  test("Submitting when pure calculation engine fails with null returns distance error", () => {
    const carBtn = document.getElementById("btn-car");
    carBtn.setAttribute("aria-checked", "true");
    elements.distanceInput.value = "10";
    carBtn.dataset.coeff = "abc";
    const event = { preventDefault: jest.fn() };
    handleFormSubmit(event, elements);
    expect(elements.distanceErr.classList.contains("hidden")).toBe(false);
  });
});

describe("DOM Initialization and App Lifecycle", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="footprint-form">
        <div id="transport-selector">
          <button type="button" id="btn-car" class="transport-btn border-slate-600 bg-slate-900" data-type="car" data-coeff="0.24" aria-checked="false"></button>
          <button type="button" id="btn-bus" class="transport-btn border-slate-600 bg-slate-900" data-type="bus" data-coeff="0.08" aria-checked="false"></button>
          <button type="button" id="btn-bike" class="transport-btn border-slate-600 bg-slate-900" data-type="bike" data-coeff="0.00" aria-checked="false"></button>
        </div>
        <p id="transport-error" class=""></p>
        
        <input type="number" id="distance-input" value="">
        <p id="distance-error" class="hidden"></p>
        
        <button type="submit" id="calculate-btn"></button>
      </form>
      
      <div id="result-box" class="hidden">
        <span id="emissions-output">0.00</span>
        <ul id="insights-list"></ul>
      </div>
      
      <div id="sr-announcer"></div>
    `;

    // Initialize the app programmatically to bind all event listeners
    initializeApp();
  });

  test("clicking a transport mode button successfully alters the DOM state and toggles the validation error hidden toggles", () => {
    const carBtn = document.getElementById("btn-car");
    const transportErr = document.getElementById("transport-error");

    expect(carBtn.getAttribute("aria-checked")).toBe("false");
    
    // Simulate a user click
    carBtn.click();
    
    expect(carBtn.getAttribute("aria-checked")).toBe("true");
    expect(carBtn.classList.contains("border-emerald-500")).toBe(true);
    expect(transportErr.classList.contains("hidden")).toBe(true);
  });

  test("keyboard navigation seamlessly shifts focus and checks adjacent buttons", () => {
    const carBtn = document.getElementById("btn-car");
    const busBtn = document.getElementById("btn-bus");
    const bikeBtn = document.getElementById("btn-bike");

    // Press ArrowRight on the first button (car)
    carBtn.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(busBtn.getAttribute("aria-checked")).toBe("true");
    expect(carBtn.getAttribute("aria-checked")).toBe("false");

    // Press ArrowDown on the second button (bus)
    busBtn.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(bikeBtn.getAttribute("aria-checked")).toBe("true");
    expect(busBtn.getAttribute("aria-checked")).toBe("false");

    // Press ArrowLeft on the third button (bike)
    bikeBtn.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(busBtn.getAttribute("aria-checked")).toBe("true");

    // Press ArrowUp on the second button (bus)
    busBtn.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(carBtn.getAttribute("aria-checked")).toBe("true");
  });
});
