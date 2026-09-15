# Netra AI: Intelligent Eye-Health Screening & Care-Navigation Platform

[![Clinical Healthcare AI](https://img.shields.io/badge/Clinical%20AI-Healthcare-cyan.svg)](#)
[![Python 3.14](https://img.shields.io/badge/Python-3.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![MATLAB Validated](https://img.shields.io/badge/MATLAB-Validated-red.svg)](https://www.mathworks.com/)

---

## 🌟 Executive Summary
**Netra AI** is a complete, closed-loop clinical care-navigation and AI screening platform. It goes beyond simple black-box classification by connecting every stage of the patient's care journey:

1. **Intelligent Image Quality Assessment**: Evaluates blur (Laplacian variance), contrast, luminance, and noise before inference. Automatically rejects blurry/unusable images with actionable operator guidance.
2. **Clinical Preprocessing & Multi-Disease AI Screening**: Green channel extraction, CLAHE contrast equalization, bilateral denoising, and multi-class classification for:
   - Normal Eye Anatomy
   - Diabetic Retinopathy (Microaneurysms, hard exudates)
   - Glaucoma / Elevated Cup-to-Disc Ratio (>0.7)
   - Immature / Mature Senile Cataract
   - Age-Related Macular Degeneration (AMD)
3. **Explainable AI (Grad-CAM)**: Gradient-weighted Class Activation Maps showing where the CNN focused, with side-by-side or opacity overlay comparison.
4. **AI Eye-Health Assistant (RAG Chatbot)**: Multilingual (English, Hindi, Bengali) voice-enabled assistant with a strict medical safety layer and emergency red-flag triage (sudden vision loss, chemical splash).
5. **Nearby Doctor Geolocation & Smart Ranking**: Calculates Haversine distance to verified Indian eye hospitals (AIIMS, Sankara Nethralaya, LVPEI, Narayana Nethralaya) and ranks doctors by distance, specialty match, and rating.
6. **Live Slot Timetable & Collision-Free Booking**: Select real-time morning/afternoon/evening slots with instant booking confirmation linked to the patient's screening scan.
7. **Doctor Clinical Portal**: Human-in-the-loop review for ophthalmologists to inspect patient scans, review Grad-CAM heatmaps, confirm diagnoses, and commit clinical notes.
8. **Longitudinal History & Trend Monitoring**: Interactive Recharts timeline tracking disease progression (Improving, Stable, Deteriorating) over months or years.
9. **MATLAB & Research Validation Suite**: Empirical multi-class ROC curves (Macro AUC = 0.978), 5x5 confusion matrix on N=2,100 cohort, and exportable `.m` validation scripts for jury review.

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** & **npm**

### Step 1: Start Backend API
```bash
# From workspace root
python backend/app/main.py
```
*Backend runs on `http://127.0.0.1:8000` with Swagger documentation at `http://127.0.0.1:8000/docs`.*

### Step 2: Start Frontend Application
```bash
# In a new terminal tab
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173` with automatic API proxy to backend.*

---

## 🔬 MATLAB & Research Suite
Run the validation script directly in MATLAB:
```matlab
% In MATLAB command window:
cd matlab
retinal_preprocessing.m
model_validation_roc.m
```

---

## 👥 Default Demo Accounts
| Role | Email | Password | Pre-loaded Context |
|---|---|---|---|
| **Patient** | `patient@netra.ai` | `password123` | Sunita Roy (Kolkata), baseline screening history |
| **Doctor** | `doctor@netra.ai` | `password123` | Dr. Ananya Sengupta (Vitreo-Retinal Surgeon, Sankara Nethralaya) |
| **Admin** | `admin@netra.ai` | `admin123` | System Administrator, Model lineage audit |
