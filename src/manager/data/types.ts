export interface SwipeRow {
  swipe_id: string;
  user_id: string;
  persona: string;
  dietary_pref: string;
  hall: string;
  meal_period: string;
  day_of_week: string;
  is_weekend: boolean;
  swipe_ts: string;
  swipe_hour: number;
  swipe_date: string;
  wait_time_sec: number;
  ts_bin: string;
  bin_swipe_count: number;
  hall_capacity: number;
  occupancy_rate: number;
}

export interface SummaryRow {
  swipe_date: string;
  day_of_week: string;
  hall: string;
  meal_period: string;
  total_swipes: number;
  unique_users: number;
  avg_wait_sec: number;
  peak_occupancy: number;
  avg_occupancy: number;
}

export interface UserStatsRow {
  user_id: string;
  total_swipes: number;
  favorite_hall: string;
  most_common_meal: string;
  avg_wait_sec: number;
  persona: string;
  dietary_pref: string;
}

export interface MenuItemRow {
  item_id: string;
  hall: string;
  station: string;
  item_name: string;
  dietary_tags: string;
  meal_periods_served: string;
  calories: number;
}

export interface MenuScheduleRow {
  date: string;
  day_of_week: string;
  is_weekend: boolean;
  hall: string;
  meal_period: string;
  item_id: string;
  item_name: string;
  station: string;
  dietary_tags: string;
  calories: number;
  available: boolean;
}

export interface InventoryRow {
  date: string;
  day_of_week: string;
  is_weekend: boolean;
  hall: string;
  meal_period: string;
  item_id: string;
  item_name: string;
  dietary_tags: string;
  starting_units: number;
  units_served: number;
  units_remaining: number;
  depletion_pct: number;
  depleted: boolean;
  depletion_time: string;
}
