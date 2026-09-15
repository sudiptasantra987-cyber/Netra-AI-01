# Netra AI - System Architecture & Technical Guide

## 1. Vision & Problem Statement
Preventable blindness affects over 40 million individuals worldwide, with diabetes, glaucoma, and cataract being the primary culprits. In low- and middle-income nations like India, the ratio of ophthalmologists to patients is less than 1 : 100,000 in semi-urban and rural areas.

Most existing AI prototypes stop at a simple label ("Disease Detected: 92%"). This creates two fatal problems:
1. **Clinical Black-Box Anxiety**: Doctors and patients do not know *why* the AI made the decision.
2. **The "Care-Chasm" Drop-off**: Detecting a disease without directly facilitating immediate specialist consultation leaves patients stranded without medical access.

**Netra AI bridges this care-chasm.**

---

## 2. The 9-Stage Closed-Loop Care Pipeline

```
[Patient]
   │
   ▼
[1. Secure Authentication & Profile]
   │
   ▼
[2. Eye Image Capture / Upload]
   │
   ▼
[3. Real-Time Quality Assurance (Laplacian Variance, Luminance, Contrast)]
   │ ── (Fail) ──► Rejection with Guidance ("Hold camera steady, clean lens")
   │
   ▼ (Pass)
[4. Clinical Preprocessing (Green Channel Isolation + CLAHE)]
   │
   ▼
[5. Multi-Disease Classification Engine (Normal, DR, Glaucoma, Cataract, AMD)]
   │
   ▼
[6. Explainable AI (Grad-CAM Saliency Heatmap Overlay)]
   │
   ▼
[7. Conversational AI Assistant (Context-Aware RAG + Medical Safety + Emergency Red-Flag Triage)]
   │
   ▼
[8. Intelligent Doctor Discovery & Smart Platform Ranking (Haversine + Specialty Match + Slot Calendar)]
   │
   ▼
[9. Doctor Clinical Review Dashboard & Longitudinal Patient History Monitoring]
```

---

## 3. Technology Stack Breakdown

| Layer | Technologies | Role |
|---|---|---|
| **Frontend UI** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons | High-performance, responsive clinical portal with multi-language toggle (EN, HI, BN) |
| **Data Visualization** | Recharts, HTML5 Canvas, Grad-CAM Opacity Slider | Real-time health trend tracking, ROC-AUC display, side-by-side XAI comparison |
| **Backend API** | FastAPI (Python 3.14), Uvicorn, Pydantic v2 | High-concurrency async REST endpoints, JWT authorization |
| **Computer Vision & AI** | OpenCV 4.10, NumPy 2.5, Pillow | Laplacian blur detection, CLAHE enhancement, simulated CNN feature activations |
| **Explainable AI (XAI)** | Grad-CAM (Gradient-weighted Class Activation Mapping) | Lesion localization heatmaps with affected anatomical quadrant classification |
| **Care Navigation** | Haversine Geodesic Engine, Custom Ranking Algorithm | Distance, specialty match, doctor credentials, and collision-free slot booking |
| **Research & Validation** | MATLAB & Simulink | Signal preprocessing, Gabor vessel filtering, ROC-AUC, confusion matrix validation |
| **Database** | PostgreSQL / SQLite Relational Models | Relational storage for users, screenings, appointments, and audit logs |

---

## 4. Key Clinical Differentiators & Innovations
1. **Not Just An AI Model — An End-to-End Care Network**: Connects the patient from photo capture to an in-person confirmed doctor consultation.
2. **Explainable AI (Grad-CAM)**: Clinicians can slide between the raw fundus and the AI attention heatmap to inspect microvascular abnormalities.
3. **Medical Safety & Emergency Triage**: Built-in guardrails identify ocular emergencies (sudden vision loss, chemical splash, retinal tears) and trigger immediate emergency alerts with helpline assistance.
4. **Longitudinal Health Tracking**: Allows patients and clinicians to monitor disease progression across multiple checkups.
5. **Research Rigor with MATLAB**: Shows deep validation with confusion matrices and multi-class ROC curves.
