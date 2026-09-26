# ORBITSHIELD: Space Debris Collision Monitoring & Avoidance System

[![Mission Control](https://img.shields.io/badge/ORBITSHIELD-SSA%20Platform-00f0ff?style=for-the-badge&logo=satellite)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![SGP4](https://img.shields.io/badge/SGP4-Ephemeris%20Engine-3b82f6?style=flat)](https://github.com/brandon-rhodes/python-sgp4)

**OrbitShield** is an autonomous, full-stack Space Situational Awareness (SSA) decision-support platform designed for monitoring resident space objects (satellites, debris, and rocket bodies) and identifying high-consequence close approaches (conjunctions).

---

## 1. Problem Statement & Solution

Low Earth Orbit (LEO) is experiencing exponential congestion from mega-constellations and fragmentation debris (Kessler Syndrome risk). Satellite operators require automated, deterministic screening tools that can rapidly ingest Two-Line Element (TLE) ephemeris sets, perform numerical propagation, evaluate multi-factor encounter risks, and provide clear operational recommendations.

**OrbitShield** connects:
- **Frontend Mission Interface**: React + Vite + TypeScript + Tailwind CSS with Leaflet 2D ground-track mapping and Recharts analytics.
- **Backend Calculation Core**: Python + FastAPI + SGP4 numerical propagator with analytical two-body/perturbation physics.
- **Deterministic Risk Engine**: Multi-factor 0–100 Hazard Index classifying encounters as LOW, MEDIUM, HIGH, or CRITICAL.
- **AI Decision Support**: Structured telemetry explanation layer with instant offline fallback.
- **Database Persistence**: SQLAlchemy supporting both PostgreSQL and standalone SQLite.

---

## 2. Important Scientific Scope

> [!IMPORTANT]
> **Decision-Support Scope**: OrbitShield is a hackathon-grade prototype intended for situational awareness and operator education. It does **not** provide operational collision avoidance guarantees or replace formal covariance-based Conjunction Data Messages (CDMs) from the 18th Space Defense Squadron (18 SDS). All recommendations are conceptual decision-support outputs.

### Data Transparency Badges
- `DATA: LIVE` vs `DATA: DEMO` (Clear provenance indicators)
- `CALCULATION: SGP4` (Analytical SGP4 trajectory propagation)
- `EXPLANATION: AI` vs `DETERMINISTIC FALLBACK`

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (dark aerospace / mission-control theme)
- **Routing**: React Router DOM (protected layout, deep links)
- **Charts**: Recharts (risk breakdowns, distribution metrics)
- **Mapping**: Leaflet 2D Equirectangular sub-satellite projection
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+ / 3.11+ / 3.14+)
- **Validation**: Pydantic v2
- **Propagation**: `sgp4` (Simplified General Perturbations 4), `numpy`
- **Data Integration**: CelesTrak GP API, Space-Track integration architecture
- **Persistence**: SQLAlchemy 2.0 (PostgreSQL ready, SQLite fallback)
- **Auth & Security**: JWT tokens, bcrypt password hashing

---

## 4. Deterministic Risk Engine Scoring

The Risk Engine outputs an index from **0 to 100** based on three physical encounter vectors:

$$\text{Risk Score} = \text{Score}_{\text{distance}} (0\text{--}55) + \text{Score}_{\text{velocity}} (0\text{--}25) + \text{Score}_{\text{urgency}} (0\text{--}20)$$

| Metric | Range / Threshold | Points Contributed | Rationale |
| :--- | :--- | :--- | :--- |
| **Miss Distance** | $< 0.2\text{ km}$<br>$0.2\text{--}0.5\text{ km}$<br>$0.5\text{--}1.0\text{ km}$<br>$1.0\text{--}2.5\text{ km}$<br>$> 2.5\text{ km}$ | 55 pts<br>50 pts<br>42 pts<br>30 pts<br>2--20 pts | Lethal collision encounter envelope |
| **Relative Velocity** | $\ge 12.0\text{ km/s}$<br>$8.0\text{--}12.0\text{ km/s}$<br>$4.0\text{--}8.0\text{ km/s}$<br>$< 4.0\text{ km/s}$ | 25 pts<br>20 pts<br>14 pts<br>6 pts | Kinetic impact energy ($E_k = \frac{1}{2}mv^2$) & catastrophic fragmentation |
| **Encounter Urgency** | $\le 6.0\text{ hrs}$<br>$6.0\text{--}12.0\text{ hrs}$<br>$12.0\text{--}24.0\text{ hrs}$<br>$> 24.0\text{ hrs}$ | 20 pts<br>15 pts<br>10 pts<br>2--5 pts | Operational reaction & maneuver planning timeline |

### Risk Classifications
- **CRITICAL** ($\ge 80$): Immediate alert generated, consider collision avoidance maneuver.
- **HIGH** ($60\text{--}79.9$): Alert generated, prioritize radar tasking & conjunction review.
- **MEDIUM** ($35\text{--}59.9$): Request additional tracking passes.
- **LOW** ($< 35$): Nominal orbital screening baseline.

---

## 5. End-to-End Judge Demo Flow

1. **Launch & Login**: Open `http://localhost:5173/login`. Login with `demo@orbitshield.space` / `orbitshield2026`.
2. **Dashboard**: Observe real-time metrics loaded from the backend API: Tracked Objects, Active Satellites, Debris, and Conjunction History.
3. **Satellite Monitor** (`/monitor`): Search for `ISS (ZARYA)` (NORAD #25544) or `COSMOS 1408 DEBRIS`. Inspect orbital period, inclination, altitude, and raw TLEs. Click **RUN COLLISION ANALYSIS**.
4. **Collision Analysis** (`/analysis`): Target A and Target B pre-populate. Select a **24-hour** screening window. Click **ANALYZE CONJUNCTION**.
5. **Loading Sequence**: Watch the animated SGP4 calculation stages.
6. **Analysis Result** (`/analysis/:id`):
   - Review exact closest approach distance (km) and relative velocity (km/s).
   - Inspect deterministic risk breakdown chart.
   - Review AI technical explanation (or deterministic fallback).
   - Review operational avoidance recommendation.
7. **Alerts** (`/alerts`): High-risk conjunction automatically creates a critical alert. Click **Mark Reviewed**.
8. **History Archive** (`/history`): Open the permanent database log, verify the record persisted, and reload the browser to confirm persistence.

---

## 6. Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=.
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Docker / Container Deployment

Run all services (PostgreSQL, Backend API, Nginx-served Frontend) via Docker Compose:

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## 8. Automated Tests

Run backend unit tests for the SGP4 service and Risk Engine:
```bash
PYTHONPATH=backend pytest backend/tests
```

---

## 9. Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./orbitshield.db` | PostgreSQL or SQLite database connection URI |
| `SECRET_KEY` | `orbitshield-super-secret-key-hackathon-2026-orbital` | JWT signing secret |
| `SPACE_TRACK_USERNAME`| `""` | Optional Space-Track.org login credentials |
| `SPACE_TRACK_PASSWORD`| `""` | Optional Space-Track.org login credentials |
| `AI_API_KEY` | `""` | OpenAI/Anthropic-compatible API key (optional; fallback active) |
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL for frontend client |

---

## 10. Limitations & Future Scope
- **Covariance Matrix Ingestion**: Future iterations can parse standard CCSDS OEM / CDM files for 3D positional covariance error ellipsoids.
- **Thrust Optimization**: Integrate continuous/impulsive maneuver trajectory optimization (e.g. Gauss-Clohessy-Wiltshire equations).
- **Cesium 3D Globe**: Expand from high-performance 2D WGS-84 to GPU-accelerated 3D WebGL orbital meshes.
