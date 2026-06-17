"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// PURE MATH ENGINE
// ─────────────────────────────────────────────────────────────────────────────

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

function buildInsights(type, distance) {
  const tips = [];

  if (type === "car" && distance > 10) {
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

function handleFormSubmit(event, elements) {
  event.preventDefault();

  const selectedBtn = Array.from(elements.transportBtns).find(
    (btn) => btn.getAttribute("aria-checked") === "true"
  );
  const selectedCoeff = selectedBtn ? parseFloat(selectedBtn.dataset.coeff) : null;
  const selectedType = selectedBtn ? selectedBtn.dataset.type : null;

  const isTransportValid = selectedCoeff !== null;
  if (!isTransportValid) {
    elements.transportErr.classList.remove("hidden");
  } else {
    elements.transportErr.classList.add("hidden");
  }

  const rawDistance = elements.distanceInput.value.trim();
  const distance = parseFloat(rawDistance);
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
  
  buildInsights(selectedType, distance).forEach((tip) => {
    const ownerDoc = elements.insightsList.ownerDocument || document;
    const li = ownerDoc.createElement("li");
    li.textContent = tip;
    elements.insightsList.appendChild(li);
  });

  elements.resultBox.classList.remove("hidden");
  elements.announcer.textContent = "Results updated. Your daily carbon footprint is " + result.toFixed(2) + " kilograms of CO2 equivalent.";
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

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
        b.classList.remove("border-emerald-500", "bg-emerald-900/30", "text-emerald-400");
        b.classList.add("border-slate-600", "bg-slate-900");
      });

      btn.setAttribute("aria-checked", "true");
      btn.classList.remove("border-slate-600", "bg-slate-900");
      btn.classList.add("border-emerald-500", "bg-emerald-900/30", "text-emerald-400");

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
