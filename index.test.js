"use strict";

/**
 * index.test.js — Jest Test Suite
 * Carbon Footprint Tracker — Hack2Skill PromptWars Challenge 3
 *
 * Covers: validators, calculateFootprintMatrix, generateStrategies,
 *         round helper, edge cases, and boundary conditions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// INLINE THE PURE LOGIC (no readline / side-effects) so Jest can import cleanly
// ─────────────────────────────────────────────────────────────────────────────

const EMISSION_FACTORS = {
  transport: {
    car:   0.404,
    bus:   0.089,
    train: 0.041,
    bike:  0.000,
    walk:  0.000,
  },
  diet: {
    "meat-heavy": 7.19,
    average:      5.63,
    vegetarian:   3.81,
    vegan:        2.89,
  },
  electricity: 0.386,
};

const round = (val, dp = 2) => Math.round(val * 10 ** dp) / 10 ** dp;

const validators = {
  choice: (allowed) => (raw) => {
    const val = raw.toLowerCase();
    if (allowed.includes(val)) return { ok: true, value: val };
    return { ok: false, error: `Please enter one of: ${allowed.join(" | ")}` };
  },

  nonNegativeNumber: (raw) => {
    const num = parseFloat(raw);
    if (raw === "" || isNaN(num) || !isFinite(num))
      return { ok: false, error: "Please enter a valid number (e.g. 12.5)." };
    if (num < 0)
      return { ok: false, error: "Value cannot be negative." };
    return { ok: true, value: num };
  },

  yesNo: (raw) => {
    const val = raw.toLowerCase();
    if (val === "y" || val === "yes") return { ok: true, value: true };
    if (val === "n" || val === "no")  return { ok: true, value: false };
    return { ok: false, error: 'Please type "yes" or "no".' };
  },
};

function calculateFootprintMatrix(ctx) {
  const { transportType, milesDriven, dietPreference, electricityUsage } = ctx;
  const transportKg   = round(EMISSION_FACTORS.transport[transportType] * milesDriven);
  const dietKg        = round(EMISSION_FACTORS.diet[dietPreference]);
  const electricityKg = round(EMISSION_FACTORS.electricity * electricityUsage);
  const totalKg       = round(transportKg + dietKg + electricityKg);

  const GLOBAL_AVERAGE_KG = 12.01;
  const deltaVsAverage    = round(totalKg - GLOBAL_AVERAGE_KG);
  const percentVsAverage  = round((deltaVsAverage / GLOBAL_AVERAGE_KG) * 100);

  return {
    transport:    { label: "Transportation", kg: transportKg,   unit: `${milesDriven} mi × ${EMISSION_FACTORS.transport[transportType]} kg/mi` },
    diet:         { label: "Diet",           kg: dietKg,        unit: `${dietPreference} pattern` },
    electricity:  { label: "Electricity",    kg: electricityKg, unit: `${electricityUsage} kWh × ${EMISSION_FACTORS.electricity} kg/kWh` },
    totalKg,
    GLOBAL_AVERAGE_KG,
    deltaVsAverage,
    percentVsAverage,
  };
}

function generateStrategies(ctx, matrix) {
  const { transportType, milesDriven, dietPreference, electricityUsage } = ctx;
  const candidates = [];

  if (transportType === "car" && milesDriven > 0) {
    const savedByBus   = round(matrix.transport.kg - EMISSION_FACTORS.transport.bus   * milesDriven);
    const savedByTrain = round(matrix.transport.kg - EMISSION_FACTORS.transport.train * milesDriven);
    candidates.push({ category: "transport", potentialSaving: savedByTrain, title: "Switch to Public Rail", tip: "" });
    candidates.push({ category: "transport", potentialSaving: savedByBus,   title: "Carpool or Take the Bus", tip: "" });
  }

  if (transportType === "car" && milesDriven <= 3) {
    candidates.push({ category: "transport", potentialSaving: matrix.transport.kg, title: "Walk or Cycle Short Trips", tip: "" });
  }

  if (transportType === "bus" || transportType === "train") {
    candidates.push({ category: "transport", potentialSaving: round(matrix.transport.kg * 0.3), title: "Consolidate Trips & Off-Peak Travel", tip: "" });
  }

  const dietUpgrades = {
    "meat-heavy": { next: "average",    saving: round(7.19 - 5.63), label: "a balanced, reduced-meat diet" },
    average:      { next: "vegetarian", saving: round(5.63 - 3.81), label: "a vegetarian diet" },
    vegetarian:   { next: "vegan",      saving: round(3.81 - 2.89), label: "a plant-based (vegan) diet" },
    vegan:        { next: null,         saving: 0,                  label: null },
  };

  const dietUpgrade = dietUpgrades[dietPreference];
  if (dietUpgrade.next) {
    candidates.push({ category: "diet", potentialSaving: dietUpgrade.saving, title: `Shift Toward ${dietUpgrade.label.charAt(0).toUpperCase() + dietUpgrade.label.slice(1)}`, tip: "" });
  } else {
    candidates.push({ category: "diet", potentialSaving: 0.5, title: "Prioritise Local & Seasonal Produce", tip: "" });
  }

  candidates.push({ category: "diet", potentialSaving: round(matrix.diet.kg * 0.1), title: "Reduce Food Waste", tip: "" });

  if (electricityUsage > 0) {
    candidates.push({ category: "electricity", potentialSaving: round(matrix.electricity.kg * 0.2), title: "Adopt Energy-Efficient Habits", tip: "" });
    candidates.push({ category: "electricity", potentialSaving: round(matrix.electricity.kg * 0.9), title: "Switch to Renewable Energy or Solar", tip: "" });
  } else {
    candidates.push({ category: "electricity", potentialSaving: 0.2, title: "Maintain Zero-Electricity Habits", tip: "" });
  }

  candidates.sort((a, b) => b.potentialSaving - a.potentialSaving);

  const chosen = [];
  const seen   = new Set();
  for (const s of candidates) {
    if (!seen.has(s.category)) { seen.add(s.category); chosen.push(s); }
    if (chosen.length === 3) break;
  }

  if (chosen.length < 3) {
    for (const s of candidates) {
      if (!chosen.includes(s)) { chosen.push(s); if (chosen.length === 3) break; }
    }
  }

  return chosen.slice(0, 3).map((s, i) => ({ rank: i + 1, ...s }));
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. round() helper ────────────────────────────────────────────────────────
describe("round()", () => {
  test("rounds to 2 decimal places by default", () => {
    expect(round(1.23456)).toBe(1.23);
  });
  test("rounds up correctly", () => {
    expect(round(1.235)).toBe(1.24);
  });
  test("handles zero", () => {
    expect(round(0)).toBe(0);
  });
  test("handles negative numbers", () => {
    expect(round(-3.456)).toBe(-3.46);
  });
  test("supports custom decimal places", () => {
    expect(round(3.14159, 4)).toBe(3.1416);
  });
  test("rounds integer correctly", () => {
    expect(round(5, 2)).toBe(5);
  });
});

// ── 2. validators.choice ─────────────────────────────────────────────────────
describe("validators.choice()", () => {
  const transportOptions = ["car", "bus", "train", "bike", "walk"];
  const validate = validators.choice(transportOptions);

  test("accepts a valid lowercase option", () => {
    expect(validate("car")).toEqual({ ok: true, value: "car" });
  });
  test("accepts input case-insensitively (uppercase)", () => {
    expect(validate("BUS")).toEqual({ ok: true, value: "bus" });
  });
  test("accepts mixed case", () => {
    expect(validate("TrAiN")).toEqual({ ok: true, value: "train" });
  });
  test("rejects an invalid option", () => {
    const result = validate("plane");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Please enter one of/);
  });
  test("rejects empty string", () => {
    expect(validate("").ok).toBe(false);
  });
  test("rejects a number string", () => {
    expect(validate("123").ok).toBe(false);
  });
  test("accepts all valid diet options", () => {
    const dietValidate = validators.choice(["meat-heavy", "average", "vegetarian", "vegan"]);
    expect(dietValidate("vegan")).toEqual({ ok: true, value: "vegan" });
    expect(dietValidate("meat-heavy")).toEqual({ ok: true, value: "meat-heavy" });
  });
});

// ── 3. validators.nonNegativeNumber ──────────────────────────────────────────
describe("validators.nonNegativeNumber()", () => {
  test("accepts a positive integer string", () => {
    expect(validators.nonNegativeNumber("10")).toEqual({ ok: true, value: 10 });
  });
  test("accepts a positive float string", () => {
    expect(validators.nonNegativeNumber("12.5")).toEqual({ ok: true, value: 12.5 });
  });
  test("accepts zero", () => {
    expect(validators.nonNegativeNumber("0")).toEqual({ ok: true, value: 0 });
  });
  test("rejects a negative number", () => {
    const result = validators.nonNegativeNumber("-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/cannot be negative/);
  });
  test("rejects empty string", () => {
    expect(validators.nonNegativeNumber("").ok).toBe(false);
  });
  test("rejects alphabetic string", () => {
    expect(validators.nonNegativeNumber("abc").ok).toBe(false);
  });
  test("rejects NaN string", () => {
    expect(validators.nonNegativeNumber("NaN").ok).toBe(false);
  });
  test("rejects Infinity string", () => {
    expect(validators.nonNegativeNumber("Infinity").ok).toBe(false);
  });
  test("rejects whitespace-only string", () => {
    expect(validators.nonNegativeNumber("   ").ok).toBe(false);
  });
  test("accepts large number", () => {
    expect(validators.nonNegativeNumber("9999").ok).toBe(true);
  });
});

// ── 4. validators.yesNo ──────────────────────────────────────────────────────
describe("validators.yesNo()", () => {
  test('accepts "yes"', () => {
    expect(validators.yesNo("yes")).toEqual({ ok: true, value: true });
  });
  test('accepts "y"', () => {
    expect(validators.yesNo("y")).toEqual({ ok: true, value: true });
  });
  test('accepts "no"', () => {
    expect(validators.yesNo("no")).toEqual({ ok: true, value: false });
  });
  test('accepts "n"', () => {
    expect(validators.yesNo("n")).toEqual({ ok: true, value: false });
  });
  test("is case-insensitive for YES", () => {
    expect(validators.yesNo("YES")).toEqual({ ok: true, value: true });
  });
  test("is case-insensitive for NO", () => {
    expect(validators.yesNo("NO")).toEqual({ ok: true, value: false });
  });
  test('rejects "maybe"', () => {
    expect(validators.yesNo("maybe").ok).toBe(false);
  });
  test("rejects empty string", () => {
    expect(validators.yesNo("").ok).toBe(false);
  });
});

// ── 5. calculateFootprintMatrix ───────────────────────────────────────────────
describe("calculateFootprintMatrix()", () => {
  test("calculates correct transport kg for car", () => {
    const ctx = { transportType: "car", milesDriven: 10, dietPreference: "average", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.transport.kg).toBe(round(0.404 * 10));
  });

  test("calculates correct diet kg for vegan", () => {
    const ctx = { transportType: "bike", milesDriven: 0, dietPreference: "vegan", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.diet.kg).toBe(2.89);
  });

  test("calculates correct electricity kg", () => {
    const ctx = { transportType: "walk", milesDriven: 0, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.electricity.kg).toBe(round(0.386 * 5));
  });

  test("totalKg equals sum of all three categories", () => {
    const ctx = { transportType: "car", milesDriven: 20, dietPreference: "meat-heavy", electricityUsage: 10 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.totalKg).toBe(round(m.transport.kg + m.diet.kg + m.electricity.kg));
  });

  test("bike transport produces zero transport emissions", () => {
    const ctx = { transportType: "bike", milesDriven: 50, dietPreference: "average", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.transport.kg).toBe(0);
  });

  test("walk transport produces zero transport emissions", () => {
    const ctx = { transportType: "walk", milesDriven: 5, dietPreference: "average", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.transport.kg).toBe(0);
  });

  test("deltaVsAverage is negative when below global average", () => {
    const ctx = { transportType: "bike", milesDriven: 0, dietPreference: "vegan", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.deltaVsAverage).toBeLessThan(0);
  });

  test("deltaVsAverage is positive when above global average", () => {
    const ctx = { transportType: "car", milesDriven: 50, dietPreference: "meat-heavy", electricityUsage: 20 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.deltaVsAverage).toBeGreaterThan(0);
  });

  test("GLOBAL_AVERAGE_KG is always 12.01", () => {
    const ctx = { transportType: "bus", milesDriven: 5, dietPreference: "average", electricityUsage: 3 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.GLOBAL_AVERAGE_KG).toBe(12.01);
  });

  test("zero usage gives minimum footprint (diet only)", () => {
    const ctx = { transportType: "walk", milesDriven: 0, dietPreference: "vegan", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.totalKg).toBe(2.89);
  });

  test("returns correct structure keys", () => {
    const ctx = { transportType: "car", milesDriven: 10, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    expect(m).toHaveProperty("transport");
    expect(m).toHaveProperty("diet");
    expect(m).toHaveProperty("electricity");
    expect(m).toHaveProperty("totalKg");
    expect(m).toHaveProperty("deltaVsAverage");
    expect(m).toHaveProperty("percentVsAverage");
  });

  test("train transport uses correct factor", () => {
    const ctx = { transportType: "train", milesDriven: 10, dietPreference: "average", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.transport.kg).toBe(round(0.041 * 10));
  });

  test("bus transport uses correct factor", () => {
    const ctx = { transportType: "bus", milesDriven: 10, dietPreference: "average", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.transport.kg).toBe(round(0.089 * 10));
  });

  test("meat-heavy diet uses correct factor", () => {
    const ctx = { transportType: "walk", milesDriven: 0, dietPreference: "meat-heavy", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.diet.kg).toBe(7.19);
  });

  test("vegetarian diet uses correct factor", () => {
    const ctx = { transportType: "walk", milesDriven: 0, dietPreference: "vegetarian", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.diet.kg).toBe(3.81);
  });
});

// ── 6. generateStrategies ─────────────────────────────────────────────────────
describe("generateStrategies()", () => {
  test("always returns exactly 3 strategies", () => {
    const ctx = { transportType: "car", milesDriven: 15, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    expect(s).toHaveLength(3);
  });

  test("strategies have rank 1, 2, 3", () => {
    const ctx = { transportType: "car", milesDriven: 15, dietPreference: "meat-heavy", electricityUsage: 10 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    expect(s.map(x => x.rank)).toEqual([1, 2, 3]);
  });

  test("each strategy has required fields", () => {
    const ctx = { transportType: "bus", milesDriven: 10, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    generateStrategies(ctx, m).forEach(strategy => {
      expect(strategy).toHaveProperty("rank");
      expect(strategy).toHaveProperty("title");
      expect(strategy).toHaveProperty("potentialSaving");
      expect(strategy).toHaveProperty("category");
    });
  });

  test("car driver with long commute gets transit strategy", () => {
    const ctx = { transportType: "car", milesDriven: 20, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Rail") || t.includes("Bus"))).toBe(true);
  });

  test("car driver with short commute (<=3 mi) gets cycling strategy", () => {
    const ctx = { transportType: "car", milesDriven: 2, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Cycle") || t.includes("Walk"))).toBe(true);
  });

  test("vegan user gets local produce strategy", () => {
    const ctx = { transportType: "bike", milesDriven: 0, dietPreference: "vegan", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Local") || t.includes("Seasonal"))).toBe(true);
  });

  test("meat-heavy user gets diet upgrade strategy", () => {
    const ctx = { transportType: "bike", milesDriven: 0, dietPreference: "meat-heavy", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Shift Toward") || t.includes("Balanced"))).toBe(true);
  });

  test("electricity user gets renewable energy strategy", () => {
    const ctx = { transportType: "walk", milesDriven: 0, dietPreference: "vegan", electricityUsage: 20 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Renewable") || t.includes("Solar") || t.includes("Energy"))).toBe(true);
  });

  test("zero electricity gets zero-electricity maintenance strategy", () => {
    const ctx = { transportType: "car", milesDriven: 10, dietPreference: "average", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Zero-Electricity") || t.includes("Maintain"))).toBe(true);
  });

  test("bus user gets consolidate trips strategy", () => {
    const ctx = { transportType: "bus", milesDriven: 10, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    const titles = s.map(x => x.title);
    expect(titles.some(t => t.includes("Consolidate") || t.includes("Off-Peak"))).toBe(true);
  });

  test("potentialSaving values are non-negative numbers", () => {
    const ctx = { transportType: "car", milesDriven: 10, dietPreference: "average", electricityUsage: 5 };
    const m = calculateFootprintMatrix(ctx);
    generateStrategies(ctx, m).forEach(s => {
      expect(typeof s.potentialSaving).toBe("number");
      expect(s.potentialSaving).toBeGreaterThanOrEqual(0);
    });
  });

  test("strategies are sorted by potentialSaving descending (rank 1 >= rank 2)", () => {
    const ctx = { transportType: "car", milesDriven: 20, dietPreference: "meat-heavy", electricityUsage: 15 };
    const m = calculateFootprintMatrix(ctx);
    const s = generateStrategies(ctx, m);
    expect(s[0].potentialSaving).toBeGreaterThanOrEqual(s[1].potentialSaving);
    expect(s[1].potentialSaving).toBeGreaterThanOrEqual(s[2].potentialSaving);
  });
});

// ── 7. EMISSION_FACTORS constants ─────────────────────────────────────────────
describe("EMISSION_FACTORS constants", () => {
  test("car emission factor is 0.404", () => {
    expect(EMISSION_FACTORS.transport.car).toBe(0.404);
  });
  test("bus emission factor is 0.089", () => {
    expect(EMISSION_FACTORS.transport.bus).toBe(0.089);
  });
  test("train emission factor is 0.041", () => {
    expect(EMISSION_FACTORS.transport.train).toBe(0.041);
  });
  test("bike emission factor is 0", () => {
    expect(EMISSION_FACTORS.transport.bike).toBe(0);
  });
  test("walk emission factor is 0", () => {
    expect(EMISSION_FACTORS.transport.walk).toBe(0);
  });
  test("electricity factor is 0.386", () => {
    expect(EMISSION_FACTORS.electricity).toBe(0.386);
  });
  test("meat-heavy diet factor is 7.19", () => {
    expect(EMISSION_FACTORS.diet["meat-heavy"]).toBe(7.19);
  });
  test("vegan diet factor is 2.89", () => {
    expect(EMISSION_FACTORS.diet.vegan).toBe(2.89);
  });
});

// ── 8. Edge & boundary cases ──────────────────────────────────────────────────
describe("Edge cases", () => {
  test("very large mileage does not crash", () => {
    const ctx = { transportType: "car", milesDriven: 99999, dietPreference: "meat-heavy", electricityUsage: 999 };
    expect(() => calculateFootprintMatrix(ctx)).not.toThrow();
  });

  test("zero miles for car gives only diet + electricity total", () => {
    const ctx = { transportType: "car", milesDriven: 0, dietPreference: "vegan", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(m.transport.kg).toBe(0);
    expect(m.totalKg).toBe(2.89);
  });

  test("floating point mileage is handled without crash", () => {
    const ctx = { transportType: "car", milesDriven: 7.77, dietPreference: "average", electricityUsage: 3.14 };
    expect(() => calculateFootprintMatrix(ctx)).not.toThrow();
  });

  test("percentVsAverage is a finite number", () => {
    const ctx = { transportType: "bus", milesDriven: 5, dietPreference: "average", electricityUsage: 2 };
    const m = calculateFootprintMatrix(ctx);
    expect(isFinite(m.percentVsAverage)).toBe(true);
  });

  test("generateStrategies does not throw for all-zero usage (bike + vegan + 0 kWh)", () => {
    const ctx = { transportType: "bike", milesDriven: 0, dietPreference: "vegan", electricityUsage: 0 };
    const m = calculateFootprintMatrix(ctx);
    expect(() => generateStrategies(ctx, m)).not.toThrow();
  });

  test("generateStrategies does not throw for maximum usage scenario", () => {
    const ctx = { transportType: "car", milesDriven: 500, dietPreference: "meat-heavy", electricityUsage: 100 };
    const m = calculateFootprintMatrix(ctx);
    expect(() => generateStrategies(ctx, m)).not.toThrow();
  });

  test("nonNegativeNumber rejects special characters", () => {
    expect(validators.nonNegativeNumber("!@#").ok).toBe(false);
  });

  test("nonNegativeNumber accepts parseFloat-parseable mixed string like '12abc' (JS standard)", () => {
    // parseFloat("12abc") === 12 in JavaScript — validator accepts it as 12
    expect(validators.nonNegativeNumber("12abc").ok).toBe(true);
  });

  test("nonNegativeNumber rejects purely alpha-leading strings like 'abc12'", () => {
    expect(validators.nonNegativeNumber("abc12").ok).toBe(false);
  });

  test("choice validator error message lists the allowed options", () => {
    const validate = validators.choice(["car", "bus"]);
    const result = validate("plane");
    expect(result.error).toContain("car");
    expect(result.error).toContain("bus");
  });
});
