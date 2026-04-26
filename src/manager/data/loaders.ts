import Papa from "papaparse";
import type {
  SwipeRow,
  SummaryRow,
  UserStatsRow,
  MenuItemRow,
  MenuScheduleRow,
  InventoryRow,
} from "./types";

function parseCsv<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

let swipesCache: SwipeRow[] | null = null;
let summaryCache: SummaryRow[] | null = null;
let userStatsCache: UserStatsRow[] | null = null;
let menuItemsCache: MenuItemRow[] | null = null;
let menuScheduleCache: MenuScheduleRow[] | null = null;
let inventoryCache: InventoryRow[] | null = null;

export const loadSwipes = async (): Promise<SwipeRow[]> => {
  if (!swipesCache) swipesCache = await parseCsv<SwipeRow>("/data/bu_dining_swipes_week.csv");
  return swipesCache;
};

export const loadSummary = async (): Promise<SummaryRow[]> => {
  if (!summaryCache) summaryCache = await parseCsv<SummaryRow>("/data/bu_dining_summary_stats.csv");
  return summaryCache;
};

export const loadUserStats = async (): Promise<UserStatsRow[]> => {
  if (!userStatsCache) userStatsCache = await parseCsv<UserStatsRow>("/data/bu_dining_user_stats.csv");
  return userStatsCache;
};

export const loadMenuItems = async (): Promise<MenuItemRow[]> => {
  if (!menuItemsCache) menuItemsCache = await parseCsv<MenuItemRow>("/data/bu_dining_menu_items.csv");
  return menuItemsCache;
};

export const loadMenuSchedule = async (): Promise<MenuScheduleRow[]> => {
  if (!menuScheduleCache) menuScheduleCache = await parseCsv<MenuScheduleRow>("/data/bu_dining_menu_schedule.csv");
  return menuScheduleCache;
};

export const loadInventory = async (): Promise<InventoryRow[]> => {
  if (!inventoryCache) inventoryCache = await parseCsv<InventoryRow>("/data/bu_dining_inventory.csv");
  return inventoryCache;
};
