import Papa from "papaparse";
import menuItemsCsv from "../../model/bu_dining_menu_items.csv?raw";
import menuScheduleCsv from "../../model/bu_dining_menu_schedule.csv?raw";
import inventoryCsv from "../../model/bu_dining_inventory.csv?raw";

const DATA_START = "2026-04-06";
const DATA_END = "2026-04-12";
const DEFAULT_DATE = "2026-04-07";

const DAY_MS = 24 * 60 * 60 * 1000;

let parsedDataPromise;

function parseCsv(raw) {
  return Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
  }).data;
}

function toDateKey(input) {
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeMealPeriod(mealPeriod) {
  const value = String(mealPeriod ?? "").trim().toLowerCase();
  if (value === "closed") return "dinner";
  return value;
}

function parseBool(value) {
  if (typeof value === "boolean") return value;
  return String(value).trim().toLowerCase() === "true";
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTag(tag) {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function parseDietaryTags(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag.length > 0);
}

function parseDateUtc(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

function normalizeHallName(hall) {
  return String(hall)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveHallName(requestedHall, knownHalls) {
  if (knownHalls.has(requestedHall)) {
    return requestedHall;
  }

  const requestedNormalized = normalizeHallName(requestedHall);
  for (const hall of knownHalls) {
    const normalized = normalizeHallName(hall);
    if (
      normalized === requestedNormalized ||
      normalized.includes(requestedNormalized) ||
      requestedNormalized.includes(normalized)
    ) {
      return hall;
    }
  }

  if (requestedNormalized.includes("stuvi2")) {
    for (const hall of knownHalls) {
      if (normalizeHallName(hall).includes("stuvi2")) {
        return hall;
      }
    }
  }

  return requestedHall;
}

function withinDataWindow(dateKey) {
  return dateKey >= DATA_START && dateKey <= DATA_END;
}

function closestDate(targetDate, availableDateKeys) {
  const targetUtc = parseDateUtc(toDateKey(targetDate)).getTime();
  let winner = availableDateKeys[0];
  let bestDistance = Infinity;

  for (const dateKey of availableDateKeys) {
    const distance = Math.abs(parseDateUtc(dateKey).getTime() - targetUtc);
    if (distance < bestDistance) {
      bestDistance = distance;
      winner = dateKey;
    }
  }

  return winner;
}

function resolveDate(dateInput, availableDateKeys) {
  if (availableDateKeys.length === 0) {
    return DEFAULT_DATE;
  }

  if (dateInput) {
    return closestDate(dateInput, availableDateKeys);
  }

  const today = new Date();
  const todayKey = toDateKey(today);

  if (!withinDataWindow(todayKey)) {
    if (availableDateKeys.includes(DEFAULT_DATE)) {
      return DEFAULT_DATE;
    }
    return closestDate(parseDateUtc(DEFAULT_DATE), availableDateKeys);
  }

  return closestDate(today, availableDateKeys);
}

function toInventoryKey(row) {
  return `${row.date}||${row.hall}||${normalizeMealPeriod(row.meal_period)}||${row.item_id}`;
}

function toSessionRow(row) {
  return {
    date: row.date,
    hall: row.hall,
    meal_period: normalizeMealPeriod(row.meal_period),
    item_id: row.item_id,
    item_name: row.item_name,
    station: row.station,
    dietary_tags: parseDietaryTags(row.dietary_tags),
    calories: parseNumber(row.calories),
    available: parseBool(row.available),
  };
}

function buildItem(sessionRow, masterRow, inventoryRow) {
  const depleted = inventoryRow ? parseBool(inventoryRow.depleted) : false;
  return {
    item_id: sessionRow.item_id,
    item_name: sessionRow.item_name,
    station: sessionRow.station || masterRow?.station || "General",
    dietary_tags:
      sessionRow.dietary_tags.length > 0
        ? sessionRow.dietary_tags
        : parseDietaryTags(masterRow?.dietary_tags),
    calories: sessionRow.calories ?? parseNumber(masterRow?.calories),
    available: sessionRow.available,
    units_remaining: inventoryRow ? parseNumber(inventoryRow.units_remaining) : null,
    depletion_pct: inventoryRow ? parseNumber(inventoryRow.depletion_pct) : null,
    depleted,
    depletion_time: depleted ? inventoryRow?.depletion_time || null : null,
  };
}

async function loadParsedData() {
  if (!parsedDataPromise) {
    parsedDataPromise = Promise.resolve().then(() => {
      const masterRows = parseCsv(menuItemsCsv);
      const scheduleRows = parseCsv(menuScheduleCsv).map(toSessionRow);
      const inventoryRows = parseCsv(inventoryCsv);

      const masterById = new Map(masterRows.map((row) => [row.item_id, row]));
      const inventoryBySession = new Map(inventoryRows.map((row) => [toInventoryKey(row), row]));
      const availableDateKeys = [...new Set(scheduleRows.map((row) => row.date))].sort();
      const knownHalls = new Set(scheduleRows.map((row) => row.hall));

      return {
        masterById,
        scheduleRows,
        inventoryBySession,
        availableDateKeys,
        knownHalls,
      };
    });
  }

  return parsedDataPromise;
}

function sessionFilter(row, hall, mealPeriod, dateKey) {
  return (
    row.date === dateKey &&
    row.hall === hall &&
    row.meal_period === normalizeMealPeriod(mealPeriod)
  );
}

export async function getMenuForSession(hall, mealPeriod, date) {
  const data = await loadParsedData();
  const dateKey = resolveDate(date, data.availableDateKeys);
  const resolvedHall = resolveHallName(hall, data.knownHalls);

  return data.scheduleRows
    .filter((row) => sessionFilter(row, resolvedHall, mealPeriod, dateKey) && row.available)
    .map((row) => {
      const masterRow = data.masterById.get(row.item_id);
      const inventoryRow = data.inventoryBySession.get(
        `${dateKey}||${resolvedHall}||${normalizeMealPeriod(mealPeriod)}||${row.item_id}`,
      );
      return buildItem(row, masterRow, inventoryRow);
    });
}

export async function getInventoryStatus(hall, mealPeriod, date) {
  const data = await loadParsedData();
  const dateKey = resolveDate(date, data.availableDateKeys);
  const resolvedHall = resolveHallName(hall, data.knownHalls);

  return data.scheduleRows
    .filter((row) => sessionFilter(row, resolvedHall, mealPeriod, dateKey))
    .map((row) => {
      const masterRow = data.masterById.get(row.item_id);
      const inventoryRow = data.inventoryBySession.get(
        `${dateKey}||${resolvedHall}||${normalizeMealPeriod(mealPeriod)}||${row.item_id}`,
      );
      return buildItem(row, masterRow, inventoryRow);
    });
}

export async function filterByDietary(items, preferenceTags) {
  const prefs = (preferenceTags || [])
    .map((tag) => normalizeTag(tag))
    .filter((tag) => tag && tag !== "none");

  if (prefs.length === 0) {
    return items;
  }

  const prefSet = new Set(prefs);
  return items.filter((item) => item.dietary_tags.some((tag) => prefSet.has(normalizeTag(tag))));
}

export async function getClosestMenuDate(date) {
  const data = await loadParsedData();
  return resolveDate(date, data.availableDateKeys);
}

export const MENU_DATA_WINDOW = {
  start: DATA_START,
  end: DATA_END,
  fallback: DEFAULT_DATE,
  dayMs: DAY_MS,
};