import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SAMPLE_IMAGES_DIR = BASE_DIR / "sample_images"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "Netra AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "netra-ai-clinical-platform-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Disease Classes
    DISEASE_CLASSES = [
        "Normal Eye Anatomy",
        "Diabetic Retinopathy",
        "Glaucoma / Elevated CDR",
        "Cataract",
        "Age-Related Macular Degeneration (AMD)"
    ]
    
    # Image Quality Thresholds
    MIN_LAPLACIAN_VAR: float = 65.0       # below this is blurry
    MIN_BRIGHTNESS: float = 40.0         # underexposed if below
    MAX_BRIGHTNESS: float = 220.0        # overexposed if above
    MIN_CONTRAST: float = 28.0           # washed out if below
    MIN_RESOLUTION: tuple = (256, 256)

settings = Settings()
