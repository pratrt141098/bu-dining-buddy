import { useState, useEffect } from "react";

const API_BASE = "https://bu-dining.onrender.com";

export interface HallPrediction {
  hall_name: string;
  meal_period: string;
  predicted_wait_min: number;
  predicted_wait_sec: number;
  predicted_occupancy_rate: number;
  occupancy_pct: number;
  status: "Normal" | "Busy" | "High";
  confidence_note: string;
}

export function useDiningData() {
  const [halls, setHalls] = useState<HallPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/predict/all`);
      const json = await res.json();
      setHalls(json.halls);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError("Could not reach prediction API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { halls, loading, error, lastUpdated, refetch: fetchData };
}
