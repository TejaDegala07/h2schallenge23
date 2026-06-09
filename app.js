"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// PURE CALCULATION FUNCTION  — testable with Jest, zero DOM dependencies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates total CO₂ emissions for a commute.
 *
 * @param {number} distance   - Distance travelled (km). Must be >= 0.
 * @param {number} coefficient - Emission factor (kg CO₂ per km). Must be >= 0.
 * @returns {number|null}     - Rounded emission in kg, or null for invalid input.
 */
function calculateEmissions(distance, coefficient) {
  // Type guard — reject non-numbers
  if (typeof distance !== "number" || typeof coefficient !== "number") {
    return null;
  }
  // Reject NaN, Infinity, or negative values
  if (isNaN(distance) || !isFinite(distance) || distance < 0) {
    return null;
  }
  if (isNaN(coefficient) || !isFinite(coefficient) || coefficient < 0) {
    return null;
  }
  return Math.round(distance * coefficient * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT — allows Jest to require this file without breaking the browser
// ─────────────────────────────────────────────────────────────────────────────
if (typeof module !== "undefined") {
  module.exports = { calculateEmissions };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM INTERACTION — only runs in a browser context
// ─────────────────────────────────────────────────────────────────────────────
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  let selectedCoeff = null;
  let selectedType  = null;

  const form          = document.getElementById("footprint-form");
  const transportBtns = document.querySelectorAll(".transport-btn");
  const distanceInput = document.getElementById("distance-input");
  const resultBox     = document.getElementById("result-box");
  const emissionsOut  = document.getElementById("emissions-output");
  const insightsList  = document.getElementById("insights-list");
  const announcer     = document.getElementById("sr-announcer");
  const transportErr  = document.getElementById("transport-error");
  const distanceErr   = document.getElementById("distance-error");

  // ── Transport button selection ──────────────────────────────────────────────
  transportBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // Update aria-checked on all buttons
      transportBtns.forEach(function (b) {
        b.setAttribute("aria-checked", "false");
        b.classList.remove("border-emerald-500", "bg-emerald-900/30", "text-emerald-400");
        b.classList.add("border-slate-600", "bg-slate-900");
      });

      // Mark this button as selected
      btn.setAttribute("aria-checked", "true");
      btn.classList.remove("border-slate-600", "bg-slate-900");
      btn.classList.add("border-emerald-500", "bg-emerald-900/30", "text-emerald-400");

      selectedCoeff = parseFloat(btn.dataset.coeff);
      selectedType  = btn.dataset.type;
      transportErr.classList.add("hidden");
    });

    // Keyboard: Space/Enter activates radio button
    btn.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // ── Form submission ─────────────────────────────────────────────────────────
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let valid = true;

    // Validate transport selection
    if (selectedCoeff === null) {
      transportErr.classList.remove("hidden");
      valid = false;
    } else {
      transportErr.classList.add("hidden");
    }

    // Validate distance
    const rawDistance = distanceInput.value.trim();
    const distance    = parseFloat(rawDistance);

    if (rawDistance === "" || isNaN(distance) || distance < 0) {
      distanceErr.classList.remove("hidden");
      distanceInput.setAttribute("aria-invalid", "true");
      valid = false;
    } else {
      distanceErr.classList.add("hidden");
      distanceInput.setAttribute("aria-invalid", "false");
    }

    if (!valid) return;

    // ── Run pure calculation ──────────────────────────────────────────────────
    const result = calculateEmissions(distance, selectedCoeff);

    if (result === null) {
      distanceErr.classList.remove("hidden");
      return;
    }

    emissionsOut.textContent = result.toFixed(2);

    // ── Build insights ────────────────────────────────────────────────────────
    insightsList.innerHTML = "";
    buildInsights(selectedType, distance).forEach(function (tip) {
      const li = document.createElement("li");
      li.textContent = tip;
      insightsList.appendChild(li);
    });

    // ── Show results ──────────────────────────────────────────────────────────
    resultBox.classList.remove("hidden");

    // ── Announce to screen readers ────────────────────────────────────────────
    announcer.textContent =
      "Results updated. Your daily carbon footprint is " +
      result.toFixed(2) +
      " kilograms of CO2 equivalent.";
  });

  // ── Insights builder ────────────────────────────────────────────────────────
  function buildInsights(type, distance) {
    const tips = [];
    if (type === "car" && distance > 10) {
      tips.push(
        "Your daily commute contributes a heavy carbon load. Consider switching to carpooling or public transport to cut emissions by roughly 60%."
      );
      tips.push(
        "Smooth acceleration and cruise control techniques can save up to 15% on fuel efficiency."
      );
    } else if (type === "bus") {
      tips.push(
        "Excellent — shared public transport saves approximately 68% more emissions than single-occupancy vehicles daily."
      );
      tips.push(
        "Combine errands into fewer trips to reduce total journey frequency further."
      );
    } else {
      tips.push(
        "Perfect zero-emission profile! Your active transport completely eliminates commute atmospheric impact."
      );
      tips.push(
        "Advocate for green pedestrian and cycling corridors in your urban neighbourhood."
      );
    }
    tips.push(
      "General tip: Offset your footprint by choosing locally sourced food and using smart home sockets to eliminate standby power draw."
    );
    return tips;
  }
});
