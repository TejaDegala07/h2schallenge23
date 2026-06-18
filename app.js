"use strict";

(function () {
  /**
   * Distance threshold in kilometers used to provide specific insights.
   * @constant {number}
   */
  const COMMUTE_THRESHOLD_KM = 10;

  // ─────────────────────────────────────────────────────────────────────────────
  // PURE MATH ENGINE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Calculates the total carbon emissions based on distance and transport coefficient.
   * @param {number} distance - The total distance traveled in kilometers.
   * @param {number} coefficient - The emission coefficient in kg CO2 per kilometer.
   * @returns {number|null} The calculated emissions rounded to two decimal places, or null if invalid inputs.
   */
  function calculateEmissions(distance, coefficient) {
    if (typeof distance !== "number" || typeof coefficient !== "number") {
      return null;
    }
    if (isNaN(distance) || !isFinite(distance) || distance < 0) {
      return null;
    }
    if (isNaN(coefficient) || !isFinite(coefficient) || coefficient < 0) {
      return null;
    }
    return Math.round(distance * coefficient * 100) / 100;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INSIGHTS BUILDER ENGINE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Builds an array of personalized, context-aware tips based on commute data.
   * @param {string} type - The primary mode of transportation (e.g., "car", "bus", "bike").
   * @param {number} distance - The daily distance traveled in kilometers.
   * @returns {string[]} An array of insights/tips.
   */
  function buildInsights(type, distance) {
    const tips = [];

    if (type === "car" && distance > COMMUTE_THRESHOLD_KM) {
      tips.push("Your daily commute contributes a heavy carbon load. Switching to carpooling or public transport can cut emissions by roughly 60%.");
      tips.push("Smooth acceleration and cruise control can save up to 15% on fuel efficiency.");
    } else if (type === "bus") {
      tips.push("Excellent — shared public transport saves approximately 68% more emissions than single-occupancy vehicles daily.");
      tips.push("Combining errands into fewer trips reduces total journey frequency further.");
    } else {
      tips.push("Perfect zero-emission profile! Your active transport completely eliminates commute atmospheric impact.");
      tips.push("Advocate for green pedestrian and cycling corridors in your urban neighbourhood.");
    }

    tips.push("General tip: Offset your footprint by choosing locally sourced food and eliminating standby power draw with smart home sockets.");

    return tips;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UI CONTROLLER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Handles the form submission event, orchestrates validation, calculation, and UI updates.
   * @param {Event} event - The form submit event.
   * @param {Object} elements - A map of cached DOM elements.
   */
  function handleFormSubmit(event, elements) {
    event.preventDefault();

    let selectedBtn = null;
    for (const btn of elements.transportBtns) {
      if (btn.getAttribute("aria-checked") === "true") {
        selectedBtn = btn;
        break;
      }
    }
    const selectedCoeff = selectedBtn ? Number(selectedBtn.dataset.coeff) : null;
    const selectedType = selectedBtn ? selectedBtn.dataset.type : null;

    const isTransportValid = selectedCoeff !== null;
    if (!isTransportValid) {
      elements.transportErr.classList.remove("hidden");
    } else {
      elements.transportErr.classList.add("hidden");
    }

    const rawDistance = elements.distanceInput.value.trim();
    const distance = Number(rawDistance);
    const isDistanceValid = rawDistance !== "" && !isNaN(distance) && distance >= 0;

    if (!isDistanceValid) {
      elements.distanceErr.classList.remove("hidden");
      elements.distanceInput.setAttribute("aria-invalid", "true");
    } else {
      elements.distanceErr.classList.add("hidden");
      elements.distanceInput.setAttribute("aria-invalid", "false");
    }

    if (!isTransportValid || !isDistanceValid) {
      return;
    }

    const result = calculateEmissions(distance, selectedCoeff);

    if (result === null) {
      elements.distanceErr.classList.remove("hidden");
      return;
    }

    elements.emissionsOut.textContent = result.toFixed(2);
    elements.insightsList.replaceChildren();
    
    const ownerDoc = elements.insightsList.ownerDocument || document;
    const fragment = ownerDoc.createDocumentFragment();
    buildInsights(selectedType, distance).forEach((tip) => {
      const li = ownerDoc.createElement("li");
      li.textContent = tip;
      fragment.appendChild(li);
    });
    elements.insightsList.appendChild(fragment);

    elements.resultBox.classList.remove("hidden");
    elements.announcer.textContent = "Results updated. Your daily carbon footprint is " + result.toFixed(2) + " kilograms of CO2 equivalent.";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Initializes the application, caches DOM elements, and sets up event delegation and listeners.
   */
  function initializeApp() {
    const form = document.getElementById("footprint-form");
    if (!form) return;

    const transportBtns = Array.from(document.querySelectorAll(".transport-btn"));
    const distanceInput = document.getElementById("distance-input");
    const resultBox = document.getElementById("result-box");
    const emissionsOut = document.getElementById("emissions-output");
    const insightsList = document.getElementById("insights-list");
    const announcer = document.getElementById("sr-announcer");
    const transportErr = document.getElementById("transport-error");
    const distanceErr = document.getElementById("distance-error");

    const elements = {
      form,
      transportBtns,
      distanceInput,
      resultBox,
      emissionsOut,
      insightsList,
      announcer,
      transportErr,
      distanceErr,
    };

    transportBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        transportBtns.forEach((b) => {
          b.setAttribute("aria-checked", "false");
          b.classList.remove("border-green-500", "bg-green-900", "bg-opacity-30", "text-green-400");
          b.classList.add("border-gray-600", "bg-gray-900");
        });

        btn.setAttribute("aria-checked", "true");
        btn.classList.remove("border-gray-600", "bg-gray-900");
        btn.classList.add("border-green-500", "bg-green-900", "bg-opacity-30", "text-green-400");

        transportErr.classList.add("hidden");
        btn.focus();
      });

      btn.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          btn.click();
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const nextIndex = (index + 1) % transportBtns.length;
          transportBtns[nextIndex].click();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const prevIndex = (index - 1 + transportBtns.length) % transportBtns.length;
          transportBtns[prevIndex].click();
        }
      });
    });

    form.addEventListener("submit", (e) => {
      handleFormSubmit(e, elements);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORT & BOOTSTRAP
  // ─────────────────────────────────────────────────────────────────────────────

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  }

  if (typeof module !== "undefined") {
    module.exports = { calculateEmissions, handleFormSubmit, buildInsights, initializeApp };
  }
})();
