-- ============================================================================
-- NETRA AI DATABASE RELATIONAL SCHEMA (PostgreSQL / SQLite DDL)
-- AI-Powered Eye-Health Screening & Care-Navigation Platform
-- ============================================================================

-- 1. Users Table (Patients, Doctors, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
    age INTEGER,
    gender VARCHAR(32),
    phone VARCHAR(32),
    city VARCHAR(128),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Eye Screenings Table
CREATE TABLE IF NOT EXISTS eye_screenings (
    screening_id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT NOT NULL,
    sharpness_score FLOAT NOT NULL,
    brightness_score FLOAT NOT NULL,
    contrast_score FLOAT NOT NULL,
    noise_level FLOAT NOT NULL,
    composite_quality FLOAT NOT NULL,
    quality_status VARCHAR(64) NOT NULL,
    primary_condition VARCHAR(128) NOT NULL,
    primary_confidence FLOAT NOT NULL,
    risk_level VARCHAR(32) NOT NULL CHECK(risk_level IN ('Low Risk', 'Moderate Risk', 'High Risk')),
    risk_score FLOAT NOT NULL,
    clinical_recommendation TEXT NOT NULL,
    affected_quadrants TEXT, -- JSON array of quadrants
    gradcam_path TEXT,
    model_version VARCHAR(64) NOT NULL DEFAULT 'Netra-EfficientNet-v1.4-XAI',
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    degrees VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    experience_years INTEGER NOT NULL,
    consultation_fee INTEGER NOT NULL,
    rating FLOAT DEFAULT 4.9,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    image_avatar TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Doctor Availability Slots
CREATE TABLE IF NOT EXISTS doctor_availability (
    slot_id VARCHAR(128) PRIMARY KEY,
    doctor_id VARCHAR(64) NOT NULL,
    slot_date DATE NOT NULL,
    time_slot VARCHAR(32) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    UNIQUE(doctor_id, slot_date, time_slot)
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64) NOT NULL,
    screening_id VARCHAR(64),
    date DATE NOT NULL,
    time_slot VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'Confirmed' CHECK(status IN ('Confirmed', 'Completed', 'Cancelled')),
    reason TEXT,
    screening_summary TEXT,
    doctor_notes TEXT,
    diagnosis_confirmed VARCHAR(128),
    prescription TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    FOREIGN KEY (screening_id) REFERENCES eye_screenings(screening_id)
);

-- 6. Model Versions Audit
CREATE TABLE IF NOT EXISTS model_versions (
    version_id VARCHAR(32) PRIMARY KEY,
    architecture VARCHAR(128) NOT NULL,
    release_date DATE NOT NULL,
    dataset_version VARCHAR(128) NOT NULL,
    accuracy FLOAT NOT NULL,
    sensitivity FLOAT NOT NULL,
    specificity FLOAT NOT NULL,
    roc_auc FLOAT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- Indexes for rapid geolocation and clinical queries
CREATE INDEX IF NOT EXISTS idx_screenings_patient ON eye_screenings(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_city ON doctors(city);
