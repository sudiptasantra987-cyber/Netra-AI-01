# Netra AI - Simulink Clinical Workflow & Signal Processing Specification

## 1. Executive Overview
In research and biomedical systems engineering, MATLAB & Simulink are employed to simulate, model, and validate the end-to-end telemetry and screening acquisition loop prior to clinical deployment. This document outlines the Simulink subsystem blocks implemented for the **Netra AI** care-navigation pipeline.

---

## 2. Simulink Block Architecture

```
[Patient Fundus Capture] ──► [Optical Lens & Noise Model] ──► [Quality Assurance Trigger]
                                                                        │
        ┌───────────────────────────────────────────────────────────────┴────────┐
        ▼                                                                        ▼
[Quality Fail: Rescan Alert]                                            [Quality Pass: Signal Flow]
                                                                                 │
                                                                                 ▼
                                                                     [Pre-processing Subsystem]
                                                                     (Green Extraction + CLAHE)
                                                                                 │
                                                                                 ▼
                                                                     [Feature Extractor Subsystem]
                                                                     (Gabor Wavelet + CNN Blocks)
                                                                                 │
                                                                                 ▼
                                                                     [Clinical Risk Estimator]
                                                                     (Low / Moderate / High)
                                                                                 │
                                                                                 ▼
                                                                     [Care Navigation Subsystem]
                                                                     (Doctor Queue & Triage)
```

---

## 3. Subsystem Breakdown

### Subsystem A: Optical Sensor & Defocus Noise Simulation
- **Block Type**: `Random Noise Generator` + `2D Gaussian Blur Kernel Block`
- **Function**: Injects variable camera jitter, uneven ambient illumination (50Hz flicker), and defocus aberration to stress-test the Laplacian variance quality filter under harsh rural clinic environments.

### Subsystem B: Real-Time Quality Decision Block
- **Block Type**: `MATLAB Function Block` (`assess_quality.m`)
- **Logic**: Implements state-machine switching:
  - If `Sharpness < 25.0` OR `Luminance < 25.0` ──► Output `Switch: 0` (Halt, Alert Operator to stabilize camera).
  - If `Criteria Met` ──► Output `Switch: 1` (Forward frame to Deep Feature Extractor).

### Subsystem C: Discrete Wavelet & Vessel Energy Engine
- **Block Type**: `2D Discrete Wavelet Transform (DWT)` with `Daubechies db4` wavelet filter banks.
- **Function**: Decomposes the retinal image into sub-bands ($LL, LH, HL, HH$) to isolate high-frequency vascular edges while eliminating sensor hum.

### Subsystem D: Clinical Care Dispatch Stateflow
- **Block Type**: `Stateflow Chart (CareNavigationStateMachine)`
- **States**:
  - `Normal_Observation`: Schedule reminder in 365 days.
  - `Moderate_Review`: Trigger doctor discovery within 14 days.
  - `High_Emergency_Triage`: Flag for immediate consultation; dispatch emergency SMS alert with nearest specialist GPS coordinate.

---

## 4. Key Clinical & Technical Takeaways
- **Simulation Rigor**: Validates that the software handles edge-case optical aberrations before reaching the patient.
- **Human-in-the-Loop**: The Stateflow model guarantees that AI never functions as an unverified standalone diagnostic, enforcing mandatory specialist sign-off.
