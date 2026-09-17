import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Detect repository root (parent of backend) or container root
ROOT_DIR = BASE_DIR.parent if (BASE_DIR.parent / "database").exists() or (BASE_DIR.parent / "frontend").exists() else BASE_DIR

# Paths with environment variable override support for persistent container volumes
SAMPLE_IMAGES_DIR = Path(os.getenv("SAMPLE_IMAGES_DIR", str(BASE_DIR / "sample_images")))
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(BASE_DIR / "uploads")))
DATABASE_FILE = Path(os.getenv("DATABASE_FILE", str(ROOT_DIR / "database" / "netra_store.json")))
FRONTEND_DIST_DIR = Path(os.getenv("FRONTEND_DIST_DIR", str(ROOT_DIR / "frontend" / "dist")))

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_FILE.parent.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "Netra AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "netra-ai-clinical-platform-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Server Binding
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    RELOAD: bool = os.getenv("RELOAD", "false").lower() in ("true", "1", "yes")

    # CORS Allowed Origins
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        raw = os.getenv("ALLOWED_ORIGINS", "*")
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    # Paths
    DATABASE_FILE: Path = DATABASE_FILE
    UPLOADS_DIR: Path = UPLOADS_DIR
    SAMPLE_IMAGES_DIR: Path = SAMPLE_IMAGES_DIR
    FRONTEND_DIST_DIR: Path = FRONTEND_DIST_DIR

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

