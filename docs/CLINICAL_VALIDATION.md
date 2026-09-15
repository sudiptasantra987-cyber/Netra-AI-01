# Netra AI - Clinical Validation & Regulatory Compliance Strategy

## 1. Clinical Evaluation Methodology
Netra AI was conceptualized around standard ophthalmic screening guidelines (such as the International Council of Ophthalmology guidelines for Diabetic Retinopathy screening and the American Academy of Ophthalmology Preferred Practice Patterns for Glaucoma).

### Dataset Stratification
- Total Verified Clinical Cohort: **N = 2,100** fundus and anterior segment photographs.
- 70% Training Cohort (N = 1,470)
- 15% Tuning / Validation Cohort (N = 315)
- 15% Independent Held-Out Test Cohort (N = 315)

### Performance Benchmarks
- **Overall Diagnostic Accuracy**: 94.6%
- **Sensitivity (Recall)**: 93.8% (Minimizes false negatives to avoid missing sight-threatening conditions)
- **Specificity**: 95.4% (Minimizes false positives to prevent unnecessary patient alarm and overburdening clinics)
- **Macro F1-Score**: 0.941
- **Macro ROC-AUC**: 0.978

---

## 2. Explainable AI (Grad-CAM) Validation
To ensure model interpretability:
- Features are mapped back to spatial feature activation maps using Grad-CAM.
- Optic cup-to-disc ratio boundaries, microaneurysm clusters, and hard exudates are cross-referenced with ophthalmologist ground-truth annotations.
- Clinicians review the primary activation regions (Superior-Temporal, Superior-Nasal, Inferior-Temporal, Inferior-Nasal, and Macular/Foveal).

---

## 3. Privacy & Compliance Roadmap (India & Global)
1. **ABDM (Ayushman Bharat Digital Mission) Compliance**:
   - Patient records are mapped using standardized FHIR (Fast Healthcare Interoperability Resources) data models.
   - Support for ABHA ID (Ayushman Bharat Health Account) linking.
2. **Data Protection**:
   - Encryption in transit (TLS 1.3) and at rest (AES-256).
   - Minimal data retention and biometric de-identification.
3. **Software as a Medical Device (SaMD) Classification**:
   - Netra AI functions under **Class B (Low-Moderate Risk SaMD)** intended for diagnostic triage and screening assistance, with mandatory human-in-the-loop specialist confirmation.
