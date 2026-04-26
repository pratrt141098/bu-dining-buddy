Built for DS719 Product Management · Spring 2026 · Boston University

# BU Dining Buddy

A mobile-first web app that helps Boston University students find the best dining hall to eat at right now — showing predicted wait times, real menu options with live inventory levels, and dietary preference matching across all five BU dining halls.

**Live apps:**
- Student app: https://bu-dining-buddy-lm7no6lcb-pratrt141098s-projects.vercel.app
- Manager dashboard: https://bu-dining-buddy-j6ncpoyjg-pratrt141098s-projects.vercel.app/manager

---

## What it does

- **Predicted wait times** — a Gradient Boosting model trained on 137,179 simulated BU card swipe events ranks all five halls by predicted wait (in seconds) for the current meal period.
- **Three meal periods** — Breakfast (7–10 am), Lunch (11 am–4:30 pm), Dinner (5–9 pm) with automatic selection based on time of day.
- **Menu options with inventory** — per-hall menu items are loaded from CSV data and shown with an inventory level % (how much stock remains). Items matching your dietary preferences are highlighted in green and sorted to the top.
- **Dietary preference filtering** — set Vegetarian, Vegan, Halal, or Gluten-Free preferences in the Profile tab; all counts and highlights update throughout the app.
- **All Halls tab** — a 2-column grid of all five halls with occupancy %, wait time, and a visual highlight on the recommended hall (no sticker — a glowing primary ring).
- **Hall Detail** — occupancy ring, wait trend sparkline (hour-by-hour GBM forecast), and the full menu grouped by station with depletion times for sold-out items.
- **Feedback tab** — a 5-question single-screen-per-question feedback flow (star rating → wait time → food availability → influence → open text). Responses are stored in `localStorage` under `feedbackLog`. Responses feed into the North Star event log alongside `lastAdoptedHall` and `lastAdoptedMeal`.
- **Meal plan strip** — swipes remaining and dining dollar balance shown on the Home tab; low-swipe alert triggers at ≤ 3 remaining.
- **Manager dashboard** — a separate B2B analytics app at `/manager` for BU Dining staff, showing live traffic heatmaps, inventory depletion analysis, menu performance, hall comparison, and demand forecasting. Built on the same CSV and model pipeline as the student app.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 + custom design tokens |
| Component primitives | shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Routing | React Router v6 |
| CSV parsing | PapaParse |
| Model API | FastAPI + scikit-learn (Gradient Boosting Regressor) |
| API hosting | Render (https://bu-dining.onrender.com) |
| State | React `useState` / `useContext` / `localStorage` |

---

## Project structure

```
bu-dining-buddy/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          # Main recommendations screen (meal toggle, ranked cards)
│   │   ├── AllHalls.tsx      # 2-column hall grid with area filter
│   │   ├── HallDetail.tsx    # Per-hall detail: occupancy ring, menu, sparkline
│   │   ├── Feedback.tsx      # 5-question feedback flow
│   │   ├── Profile.tsx       # Meal plan + dietary preferences
│   │   └── Confirmed.tsx     # Post-"Go Here" confirmation
│   ├── components/
│   │   ├── MobileShell.tsx   # App chrome: max-width container + bottom tab bar
│   │   ├── OccupancyBar.tsx  # Horizontal fill bar for occupancy %
│   │   ├── OccupancyRing.tsx # SVG ring for hall detail
│   │   ├── FoodAvailability.tsx
│   │   ├── WaitTrendSparkline.tsx  # SVG hour-by-hour wait chart
│   │   └── ui/               # shadcn/ui primitives
│   ├── data/
│   │   ├── modelOutput.ts    # Static hall predictions + hourly points (breakfast/lunch/dinner)
│   │   ├── dailySummary.ts   # CSV-derived day-of-week predictions
│   │   └── menuData.js       # PapaParse loader for menu + inventory CSVs
│   ├── lib/
│   │   └── dining.ts         # HALLS list, HALL_DISPLAY_NAMES, types, helpers
│   └── context/
│       └── PreferencesContext.tsx  # Dietary prefs + meal plan mock data
├── model/
│   ├── 01_train_model.py     # Trains wait + occupancy GBM models, saves .joblib files
│   ├── 02_evaluate.py        # Evaluation plots and metrics
│   ├── 03_api.py             # FastAPI serving /predict and /predict/all
│   ├── bu_dining_swipes_week.csv       # 137k synthetic swipe events (training data)
│   ├── bu_dining_menu_items.csv        # Menu item master (id, name, dietary tags, calories)
│   ├── bu_dining_menu_schedule.csv     # What's served per hall/meal/date
│   ├── bu_dining_inventory.csv         # Per-item inventory: units remaining, depletion %
│   ├── bu_dining_summary_stats.csv     # Day-of-week avg wait + occupancy per hall/meal
│   ├── wait_model.joblib     # Trained wait-time model
│   ├── occ_model.joblib      # Trained occupancy model
│   ├── le_hall.joblib        # Hall label encoder
│   ├── le_meal.joblib        # Meal period label encoder
│   └── model_meta.json       # Model metadata (algorithm, features, last refresh)
├── requirements.txt          # Python dependencies (model API)
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 or higher (tested on v22) |
| npm | 8 or higher |
| Python | 3.10 or higher (only needed to run the model API locally) |

---

## Frontend setup

```bash
# 1. Clone the repository
git clone https://github.com/pratrt141098/bu-dining-buddy  
cd bu-dining-buddy

# 2. Install JavaScript dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

The frontend is fully functional out of the box using the bundled CSV data and static model output — the live Python API is optional (see below).

### Other frontend scripts

```bash
npm run build       # Production build → dist/
npm run preview     # Preview the production build locally
npm run lint        # ESLint
npm run test        # Run Vitest unit tests once
npm run test:watch  # Watch mode
```

---

## Python model API setup (optional)

**Model accuracy:** 84% MAE on the holdout validation week (Gradient Boosting Regressor, scikit-learn).

The frontend proxies `/model-api` to `https://bu-dining.onrender.com` by default. If you want to run the prediction API locally:

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # macOS / Linux
# .venv\Scripts\activate       # Windows

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start the API server (must run from the model/ directory)
cd model
uvicorn 03_api:app --reload --port 8000
```

The API will be at **http://localhost:8000**. Endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check — returns hall and meal period lists |
| `POST` | `/predict` | Single-hall prediction for a given timestamp |
| `GET` | `/predict/all` | Predictions for all 5 halls, sorted by wait time |

To point the frontend at your local API instead of Render, update `vite.config.ts`:

```ts
proxy: {
  "/model-api": {
    target: "http://localhost:8000",
    rewrite: (path) => path.replace(/^\/model-api/, ""),
  },
},
```

### Retraining the model

```bash
cd model
python 01_train_model.py   # Trains and saves wait_model.joblib + occ_model.joblib
python 02_evaluate.py      # Generates evaluation plots
```

---

## Dining halls

| Display name | Full name | Capacity | Area |
|---|---|---|---|
| Marciano | Marciano Commons | 800 | East |
| Warren | Warren Towers Dining | 600 | Central |
| West | West Campus Dining | 500 | West |
| Stu-Vi 2 | Stuvi2 Dining | 400 | East |
| Sargent | Sargent Choice Café | 300 | Central |

---

## Manager dashboard

A separate analytics interface for BU Dining staff, accessible at `/manager` on the same Vercel deployment.

**URL:** https://bu-dining-buddy-j6ncpoyjg-pratrt141098s-projects.vercel.app/manager

**Pages:**

| Route | Page | Description |
|---|---|---|
| `/manager` | Overview | Weekly swipe totals, peak occupancy, avg wait, depletion incidents; weekly traffic by hall; meal period split |
| `/manager#/traffic` | Traffic | Swipe volume by hour (all halls), occupancy by meal period, avg wait by day, user persona breakdown, wait time distribution |
| `/manager#/inventory` | Inventory | Items depleted, avg depletion rate, highest-risk hall, depletion by hall and meal, starting vs remaining inventory scatter |
| `/manager#/menu` | Menu Performance | Top 10 most-served items, dietary coverage breakdown, calorie range by station |
| `/manager#/halls` | Hall Comparison | Per-hall weekly metrics cards, hourly traffic heatmap (all halls × all hours) |
| `/manager#/settings` | Settings | Alert thresholds (occupancy warning, depletion warning, high demand badge), display preferences |

The manager app reads from the same CSV pipeline as the student app (`bu_dining_swipes_week.csv`, `bu_dining_inventory.csv`, `bu_dining_menu_items.csv`) with the same 15-minute Aramark stagger applied.

---

## Meal period windows

| Period | Hours |
|---|---|
| Breakfast | 7:00 – 10:59 am |
| Lunch | 11:00 am – 4:29 pm |
| Dinner | 4:30 – 9:00 pm |
| Outside hours | Falls back to Lunch |

---

## localStorage keys

The app persists the following keys in the browser's `localStorage`:

| Key | Type | Description |
|---|---|---|
| `lastAdoptedHall` | `string` | North Star event log — records which hall the user tapped "Go Here →" on; used to measure the core adoption metric (app_open → recommendation_viewed → go_here_tapped → hall_visited) |
| `lastAdoptedMeal` | `string` | Meal period active when "Go Here →" was tapped |
| `feedbackLog` | `JSON array` | All submitted feedback entries |
| Preferences | Various | Dietary tags, meal plan data (managed by `PreferencesContext`) |

---

## Notes

- **Menu and inventory data** covers the week of April 6–12 2026 (synthetic). Dates outside this window fall back to April 7 2026.
- **Swipe count data** has an inherent 15-minute stagger built into the model training.
- **No real-time data feed** is active in the current build; the live API on Render serves predictions on demand but the CSV pipeline is the primary data source for menus and inventory.

---

## Submission notes

- Data covers the week of April 6–12 2026 (synthetic swipe events and menu/inventory data).
- The live prediction API is hosted on Render at `https://bu-dining.onrender.com`. Cold starts may take 30–60 seconds on the free tier.
- GitHub repository: [TODO — insert before submission]
- Team: Aastha Gidwani · Astika Tyagi · Pratik Tribhuwan · Riya Bharamaraddi · Shravani Maskar
