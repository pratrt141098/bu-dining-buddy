# BU Dining Optimizer — Copilot Instructions

AI-powered dining hall recommendation app for BU students. Gradient Boosting model trained on 137,179 simulated card swipe events predicts wait times across 5 halls. React frontend (Lovable/Vite) consumes pre-computed model output from a Python ML pipeline.

---

## Stack

### ML Pipeline
- Python 3.11+
- `pandas`, `numpy`, `scikit-learn` (GradientBoostingRegressor)
- `joblib` for model serialization
- Output: `src/data/modelOutput.js` — pre-computed predictions exported as ES module

### Frontend
- React 18 (Lovable / Vite, `npm run dev` on port 5173)
- Tailwind CSS for styling
- `lucide-react` for icons
- `useState` / `useEffect` only — no external state management library
- All model data consumed from `src/data/modelOutput.js`

### Scripts
- `pipeline/simulate_swipes.py` — generates synthetic swipe dataset
- `pipeline/train_model.py` — trains GBM, exports predictions to JS

---

## Repo Structure

```
src/
  components/
    HomeScreen.jsx          # Recommendation feed — ranked hall cards
    AllHallsView.jsx        # 2-column tile grid of all 5 halls
    HallDetailView.jsx      # Occupancy bar + hourly sparkline
    SettingsPanel.jsx       # Dietary preference toggles + location selector
  data/
    modelOutput.js          # Pre-computed GBM predictions (DO NOT hand-edit)
  App.jsx
pipeline/
  simulate_swipes.py        # Synthetic swipe event generator
  train_model.py            # GBM training + JS export
output/
  bu_dining_swipes_week.csv     # 137,179 simulated swipe events
  bu_dining_summary_stats.csv   # Hall × day × meal period aggregates
  bu_dining_user_stats.csv      # Per-user behavioral profiles
```

---

## Code Conventions

### Python (ML Pipeline)
- Type hints on all function signatures
- Docstrings on all public functions
- Never hardcode file paths — use `pathlib.Path` relative to project root
- Label encoders (`LabelEncoder`) must be fit only on training data — never on test or prediction inputs separately
- Model artifacts (`.joblib`) go in `pipeline/artifacts/` — never in `src/`
- All prediction outputs must include `modelGenerated: true` and a `dataSource` string in the JS export
- Round wait times to 1 decimal place (`predictedWaitMin`) and keep raw seconds (`predictedWaitSec`) alongside

### React
- Functional components only, hooks-based
- Each component in its own file under `src/components/`
- Props typed with PropTypes
- Never hardcode hall names, capacities, or wait times inline in JSX — always read from `modelOutput.js`
- Occupancy bar color logic lives in a single shared utility function — do not duplicate it across components:
  - `>= 90%` → red `#EF4444`, status `"High"`
  - `75–89%` → amber `#F59E0B`, status `"Busy"`
  - `< 75%` → teal `#00A896`, status `"Normal"`
- Every predicted number displayed to the user must include the word `"predicted"` or `"estimated"` — never present model output as live or real-time data
- The 15-min data delay caveat must appear on every screen that shows occupancy or wait time data

### Tailwind
- Dark theme throughout: background `#0f172a`, surface `#1e293b`, primary teal `#00A896`
- No inline `style={}` for colors that are part of the design system — use Tailwind classes or extend the config
- Mobile-first, 390px base width

---

## Model Output Schema

`src/data/modelOutput.js` exports three constants. Do not rename them.

### `hallPredictions` — current meal window, sorted by predicted wait ascending
```js
{
  id: number,
  name: string,           // full hall name
  shortName: string,      // display name
  rank: number,           // 1 = shortest predicted wait
  predictedWaitSec: number,
  predictedWaitMin: number,
  occupancyPct: number,
  capacity: number,
  status: "Normal" | "Busy" | "High",
  dietaryTags: string[],  // e.g. ["Halal", "Vegetarian"]
  mealPeriod: "breakfast" | "lunch" | "dinner",
  modelGenerated: true,
}
```

### `lunchPredictions` — North Star window (11am–4:30pm), same shape as above

### `hourlyPredictions` — keyed by full hall name, array of hourly data points
```js
{
  hour: number,           // 7–21
  waitMin: number,
  occupancyPct: number,
  meal: "breakfast" | "lunch" | "dinner",
}
```

### `MODEL_META` — metadata, render in the UI as a badge
```js
{
  algorithm: string,
  trainingRows: number,
  features: string[],
  target: string,
  lastRefresh: string,    // ISO timestamp
  refreshIntervalMin: number,
  dataSource: string,
}
```

---

## North Star Metric

**Weekly Lunch-Period Recommendation Adoptions** — students who open the app, receive a recommendation, and visit that hall within 30 minutes, 11am–4:30pm only.

- An adoption event fires when the user taps "Go Here →" on a recommendation card
- Only cards shown during the lunch window (11am–4:30pm) count toward the metric
- The adoption toast message must read: `"✓ Visit logged toward this week's adoption count"`
- The lunch / dinner toggle on the home screen must default to `lunchPredictions` if the current time is between 11:00 and 16:30, otherwise `hallPredictions`

---

## Key Data Constraints

| Constraint | Detail |
|---|---|
| Aramark swipe delay | 15 minutes — acknowledge on every occupancy display |
| Food / menu data | No data layer exists — do not build or mock this in MVP |
| Live feed | Not connected — all predictions are pre-computed, not real-time |
| Manager dashboard | Phase 2 — out of scope for this repo |

---

## Branch Strategy

- `main` — stable, demo-ready at all times
- `dev` — integration branch, merge feature branches here first
- Feature branches: `<name>/<feature>` (e.g. `alex/sparkline`, `alex/settings-panel`)

---

## Running the Project

```bash
# Frontend
npm install
npm run dev           # localhost:5173

# Regenerate model output (optional — modelOutput.js is already pre-generated)
pip install pandas scikit-learn numpy joblib
python pipeline/simulate_swipes.py
python pipeline/train_model.py
# outputs updated src/data/modelOutput.js automatically
```

---

## What NOT to Do

- Never hand-edit `src/data/modelOutput.js` — always regenerate via `train_model.py`
- Never present a predicted wait time without the word "predicted" visible in the UI
- Never remove the 15-min Aramark delay caveat from any screen showing occupancy data
- Never duplicate occupancy color logic — keep it in one shared utility
- Never add food/menu features to MVP — no data source exists for this
- Never commit API keys, `.env` files, or any BU/Aramark credentials
