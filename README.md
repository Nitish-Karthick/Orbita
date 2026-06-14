# 🛰️ PROJECT ORBITA (FAR AWAY 2026 MVP)
**Distributed Orbital Environmental Intelligence Network for LNT Debris (1 mm – 10 cm)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.12](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![React: Vite](https://img.shields.io/badge/React-Vite-blueviolet)](https://vitejs.dev/)
[![Status: SITL MVP](https://img.shields.io/badge/Status-SITL_MVP_Active-brightgreen)](#)

> **FAR AWAY 2026 Hackathon Submission** | **Team:** VisioniX (Re:Code) | **Phase:** A (Concept & SITL Demo)

## 🌌 Mission Statement
ORBITA is an edge-sensing payload architecture designed to map the Lethal Non-Trackable (LNT) space debris regime. It transforms host satellites from passive assets into active, distributed sensing nodes. By fusing high-frequency acoustic impact detection with localized 3D stereoscopic mapping, ORBITA generates the first large-scale statistical hazard maps of the sub-10 cm orbital environment.
##  Live Deployment:
Backend:https://orbita-ceo0.onrender.com
Frontend:https://orbitaexp.netlify.app
---

## 🏗️ Systems Architecture & Pipeline

ORBITA operates entirely independently of terrestrial radar triggers, utilizing a 4-stage autonomous edge-compute loop.
<img width="894" height="596" alt="image" src="https://github.com/user-attachments/assets/6bba688e-a8e8-487f-94d2-adf48713bae8" />


### The 4 Core Layers:
1. **Acoustic Wake-Up (< 1.0W)**: Piezo waveguide tape detects hypervelocity impacts. An FPGA runs an FFT to filter out mechanical noise.
2. **Optical Trigger (< 50ms)**: If confidence exceeds the threshold, dual global-shutter cameras activate from standby to capture the co-traveling debris stream.
3. **Kinematic Pipeline**: Computes epipolar depth ($Z = \frac{f \cdot b}{d}$). **System Constraint**: All data beyond $100m$ is mathematically discarded due to quadratic error growth.
4. **Hazard Intelligence**: Kinematics are abstracted into a Spatial Risk Heuristic (SRH) to ensure ITAR compliance, serialized into a ~100-byte CBOR packet, and transmitted.

---

## 💻 Software-in-the-Loop (SITL) MVP Overview

For FAR AWAY 2026, we built a highly stable Software-in-the-Loop (SITL) simulation demonstrating the ORBITA edge-compute pipeline.

### 🚀 Key Engineering Highlights:
- **Synthetic Orbital Environment**: Instead of basic webcams, the FastAPI backend generates a real-time, 3D-to-2D perspective projection starfield with LNT debris and kinetic impact flashes ($Z < 5m$).
- **Mathematical Reliability**: Enforces strict confidence thresholds for optical wake-ups and strict depth limit cutoffs ($100m$) for hazard reporting.
- **Concurrency Stability**: We isolated a major streaming memory leak by implementing an `async def` architecture that gracefully catches `asyncio.CancelledError` on socket drops.
- **React Mission Control**: A Vite/Tailwind dashboard with ultra-stable reactivity using cryptographic UUIDs (`crypto.randomUUID()`) for logging, featuring a dynamic English/Japanese alert system (FLY / INSPECT / NOGO).

---

## 🛠️ Quickstart: Running the MVP

We have containerized the startup process so judges can launch the full React + FastAPI stack with a single click.

### Prerequisites
- Windows OS (for `run.bat`)
- Python 3.12+
- Node.js LTS

### Launch Instructions
1. Clone the repository: `git clone https://github.com/Nitish-Karthick/Orbita.git`
2. Navigate to the root directory.
3. **Double-click `run.bat`**. This script automatically installs Python requirements, installs NPM packages, boots the Uvicorn backend on port 8000, and launches the Vite frontend on port 5173.
4. Open your browser to `http://localhost:5173`.
5. Click **"Simulate Impact"** on the dashboard to trigger the acoustic FFT, wake the cameras, and watch the pipeline calculate hazard density in real-time.

---

## ⚖️ Regulatory & Commercial Model

- **ITAR / EAR Compliant**: Exact coordinate vectors of uncatalogued objects are never transmitted. We transmit grid-based density probabilities ("Space Weather"), bypassing dual-use military regulations.
- **Bootstrapping via Insurance Subsidy**: To solve the network "cold-start" problem, Space Insurance Underwriters mandate ORBITA payloads on commercial satellites in exchange for a 15% reduction in launch insurance premiums, subsidizing the hardware cost completely.

---

### 🎬 3D Model Video


https://github.com/user-attachments/assets/9e597045-a9c1-43fd-bfa3-70086040aba3




