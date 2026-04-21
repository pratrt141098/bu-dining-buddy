# BU Dining Optimizer

> An AI-powered dining hall recommendation app for Boston University students. Get real-time wait time predictions, personalized hall rankings, and occupancy trends — all driven by a machine learning model trained on simulated BU card swipe data.

---

## What It Does

BU students lose 20–40 minutes navigating crowded dining halls during peak lunch periods with no visibility into wait times before they arrive. The BU Dining Optimizer solves this by:

- **Predicting wait times** at all 5 BU dining halls using a Gradient Boosting model
- **Ranking halls** for the current meal window based on predicted wait + your dietary preferences
- **Logging adoptions** — the app's North Star metric counts every time a student receives a recommendation and visits that hall within 30 minutes during the lunch window (11am–4:30pm)

---

## Product Context

| Attribute | Detail |
|---|---|
| Course | DS719 Product Management, Spring 2026 |
| North Star Metric | Weekly Lunch-Period Recommendation Adoptions |
| Data constraint | Aramark swipe system — 15-min refresh delay |
| Stakeholder | BU VP of Dining Operations (not hall managers) |
| MVP scope | Student recommendation feed · Adoption logging · Preference settings |

---

## Tech Stack

### ML Pipeline (Python)
| Component | Detail |
|---|---|
| Algorithm | Gradient Boosting Regressor (`scikit-learn`) |
| Training data | 137,179 simulated card swipe events |
| Users simulated | 11,000 (5 personas: residential east/west/central, commuter, off-campus) |
| Features | `hall`, `meal_period`, `day_of_week`, `hour`, `is_weekend`, `occupancy_rate`, `bin_swipe_count` |
| Target | `wait_time_seconds` |
| Libraries | `pandas`, `numpy`, `scikit-learn`, `joblib` |

### Frontend (React)
| Component | Detail |
|---|---|
| Framework | React (via Lovable) |
| Styling | Tailwind CSS |
| Icons | `lucide-react` |
| State | `useState` / `useEffect` — no external state library |
| Model data | `src/data/modelOutput.js` (pre-computed predictions exported from Python) |

---

## Project Structure

```
bu-dining-optimizer/
├── src/
│   ├── components/
│   │   ├── HomeScreen.jsx          # Recommendation feed — ranked hall cards
│   │   ├── AllHallsView.jsx        # 2-column tile grid of all 5 halls
│   │   ├── HallDetailView.jsx      # Occupancy bar + sparkline trend chart
│   │   └── SettingsPanel.jsx       # Dietary preference toggles + location
│   ├── data/
│   │   └── modelOutput.js          # Pre-computed GBM predictions (export from Python)
│   └── App.jsx
├── pipeline/
│   ├── simulate_swipes.py          # Generates 137k synthetic swipe events
│   └── train_model.py              # Trains GBM, exports predictions to JS
├── output/
│   ├── bu_dining_swipes_week.csv   # Simulated swipe dataset
│   ├── bu_dining_summary_stats.csv # Hall × day × meal period aggregates
│   └── bu_dining_user_stats.csv    # Per-user behavioral profiles
└── README.md
```

---

## ML Model — How It Works

### Data Simulation

Since BU Dining / Aramark did not provide swipe data access, 7 days of realistic card swipe behavior was simulated across 11,000 users, 5 dining halls, and 3 meal periods.

**User personas:**

| Persona | Share | Behavior |
|---|---|---|
| `residential_east` | 25% | 2.6 meals/day, prefers Marciano Commons |
| `residential_west` | 25% | 2.5 meals/day, prefers West Campus Dining |
| `residential_central` | 20% | 2.7 meals/day, spreads across halls |
| `commuter` | 20% | Lunch-heavy (90% lunch prob), only 15% breakfast |
| `off_campus_plan` | 10% | Sporadic, ~0.8 meals/day |

**Temporal realism:**
- Gaussian-distributed arrival times around each meal peak (breakfast μ=8am, lunch μ=12:18pm, dinner μ=6:12pm)
- Weekend attendance drops 28–40% vs weekday, breakfast shifts ~48 min later

### Training

```python
from sklearn.ensemble import GradientBoostingRegressor

features = ['hall_enc', 'meal_enc', 'day_enc', 'swipe_hour',
            'is_weekend', 'occupancy_rate', 'bin_swipe_count']

model = GradientBoostingRegressor(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    random_state=42
)
model.fit(X_train, y_train)  # y = wait_time_sec
```

### Model Outputs (Monday Dinner — Current Predictions)

| Rank | Hall | Predicted Wait | Occupancy | Status |
|---|---|---|---|---|
| 1 | Warren Towers Dining | ~6 min | 77.3% | Busy |
| 2 | Marciano Commons | ~7 min | 88.6% | Busy |
| 3 | West Campus Dining | ~7 min | 85.2% | Busy |
| 4 | Stuvi2 / Towers | ~7 min | 84.4% | Busy |
| 5 | Sargent Choice Café | ~7 min | 93.6% | High |

### Exported Data

Pre-computed predictions are exported as `src/data/modelOutput.js` with three exports:

- `hallPredictions` — current meal window, sorted by predicted wait (feeds home screen ranking)
- `lunchPredictions` — North Star window predictions (11am–4:30pm, Monday)
- `hourlyPredictions` — per-hall wait time curve from 7am–9pm (feeds sparkline in hall detail view)

---

## App Screens

### Home Screen
- Greeting + swipe balance + dining dollar balance
- Amber warning banner when predictions are stale (dismissible)
- Lunch / Dinner toggle — switches between `lunchPredictions` and `hallPredictions`
- 3 ranked recommendation cards, each showing:
  - Predicted wait time (labeled "predicted" — never presented as live)
  - Occupancy progress bar (color-coded: teal < 75%, amber 75–89%, red ≥ 90%)
  - Dietary match tags from user profile
  - Data caveat: "GBM model · trained on 137,179 swipes · 15-min delay — Aramark system"
- "Go Here →" CTA — logs an adoption event on tap

### All Halls View
- 2-column tile grid with all 5 halls
- Status color badge per tile
- Tap any tile to open Hall Detail

### Hall Detail View
- Occupancy bar + predicted wait for selected hall
- SVG sparkline: predicted wait time (y) vs hour 7am–9pm (x) for today
- Vertical "now" marker at current hour
- "Go Here →" CTA

### Settings Panel
- Dietary toggles: None, Vegetarian, Vegan, Halal, Gluten-Free
- Campus location: East / West / Central
- Preference changes update card ranking order on home screen in real time

---

## North Star Metric

**Weekly Lunch-Period Recommendation Adoptions**

> The number of students who open the app, receive a recommendation, and visit that dining hall within 30 minutes during the lunch window (11am–4:30pm).

The metric is scoped to the lunch window because that is the single most constrained meal period — halls regularly run out of food before 4:30pm. An adoption fires only when a student actually changes behavior: open → decide → act.

---

## Key Design Decisions

**Why synthetic data?** BU Dining operations are managed by Aramark, a third-party vendor. Hall managers (like those at Marciano Commons) work for Aramark, not BU, and have no incentive to share data externally. The correct stakeholder path is BU's VP of Dining Operations. Until that partnership is established, synthetic data grounded in realistic behavioral patterns is the honest approach.

**Why label every predicted number?** Every wait time in the UI is labeled "predicted" and includes a model attribution badge. This is both an ethical design choice and a practical one — the Aramark system has a 15-minute data delay, so presenting numbers as "live" would be misleading.

**Why pre-compute predictions instead of running the model in the browser?** The GBM model is a Python artifact. Pre-computing predictions per hall per hour and exporting them as a JS data file is the simplest integration path for a Lovable/React prototype. In production, this would be a FastAPI endpoint that re-runs inference on each Aramark data refresh.

---

## Running Locally

```bash
# Frontend
npm install
npm run dev

# ML pipeline (optional — modelOutput.js is already pre-generated)
pip install pandas scikit-learn numpy
python pipeline/simulate_swipes.py
python pipeline/train_model.py
```

---

## What's Real vs. Mocked

| Component | Status |
|---|---|
| GBM model | Real — trained on simulated data |
| Card swipe dataset | Simulated — BU/Aramark access not yet established |
| Wait time predictions | Real model output |
| Occupancy percentages | Derived from simulated swipe counts |
| Menu / food availability | Not implemented — no data layer exists at Aramark |
| Live Aramark feed | Not connected — 15-min delay constraint acknowledged |
| Manager dashboard | Phase 2 — requires BU VP partnership |

---

## Team

DS719 Product Management · Boston University · Spring 2026
