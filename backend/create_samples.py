import cv2
import numpy as np
from pathlib import Path

SAMPLE_DIR = Path(__file__).resolve().parent / "sample_images"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

def generate_fundus_base(size=512):
    """Generates standard anatomical retinal fundus background"""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    center = (size // 2, size // 2)
    radius = int(size * 0.46)
    
    # Gradient orange-red fundus pigmentation
    y, x = np.ogrid[:size, :size]
    dist_from_center = np.sqrt((x - center[0])**2 + (y - center[1])**2)
    mask = dist_from_center <= radius
    
    # Fundus coloration (BGR)
    # Natural orange-red: B~20, G~65, R~190
    radial_factor = 1.0 - (dist_from_center / radius) * 0.35
    radial_factor = np.clip(radial_factor, 0.4, 1.0)
    
    img[mask, 0] = np.uint8(22 * radial_factor[mask])
    img[mask, 1] = np.uint8(75 * radial_factor[mask])
    img[mask, 2] = np.uint8(200 * radial_factor[mask])
    
    # Subtle choroidal texture
    noise = np.random.normal(0, 4, (size, size)).astype(np.float32)
    for c in range(3):
        channel = img[:, :, c].astype(np.float32) + noise
        img[:, :, c] = np.clip(channel, 0, 255).astype(np.uint8)
        
    return img, center, radius

def add_optic_disc_and_vessels(img, disc_pos=(160, 256), disc_r=32, cup_r=12):
    """Draws anatomical optic nerve head and branching retinal vessel arcades"""
    size = img.shape[0]
    # Draw Optic Disc (yellowish-white)
    cv2.circle(img, disc_pos, disc_r, (120, 215, 245), -1)  # BGR
    # Draw Physiological Optic Cup
    cv2.circle(img, disc_pos, cup_r, (170, 240, 255), -1)
    
    # Draw Fovea / Macula (darker spot central-temporal)
    fovea_pos = (310, 260)
    cv2.circle(img, fovea_pos, 22, (15, 50, 160), -1)
    cv2.circle(img, fovea_pos, 5, (8, 30, 120), -1)
    
    # Vessel arcades branching from disc
    # Superior & Inferior temporal & nasal arcades
    vessel_color_artery = (18, 40, 160)
    vessel_color_vein = (12, 28, 125)
    
    # Superior Temporal Arcade
    pts_sup_temp = np.array([
        disc_pos,
        (disc_pos[0] + 40, disc_pos[1] - 80),
        (disc_pos[0] + 120, disc_pos[1] - 120),
        (disc_pos[0] + 220, disc_pos[1] - 110),
        (disc_pos[0] + 280, disc_pos[1] - 70)
    ], np.int32)
    cv2.polylines(img, [pts_sup_temp], False, vessel_color_vein, 4, cv2.LINE_AA)
    
    # Superior Artery
    pts_sup_art = pts_sup_temp + np.array([0, 12])
    cv2.polylines(img, [pts_sup_art], False, vessel_color_artery, 2, cv2.LINE_AA)
    
    # Inferior Temporal Arcade
    pts_inf_temp = np.array([
        disc_pos,
        (disc_pos[0] + 45, disc_pos[1] + 85),
        (disc_pos[0] + 130, disc_pos[1] + 125),
        (disc_pos[0] + 230, disc_pos[1] + 115),
        (disc_pos[0] + 285, disc_pos[1] + 75)
    ], np.int32)
    cv2.polylines(img, [pts_inf_temp], False, vessel_color_vein, 4, cv2.LINE_AA)
    
    # Inferior Artery
    pts_inf_art = pts_inf_temp + np.array([0, -12])
    cv2.polylines(img, [pts_inf_art], False, vessel_color_artery, 2, cv2.LINE_AA)
    
    # Nasal Arcades
    pts_nasal_sup = np.array([disc_pos, (disc_pos[0] - 60, disc_pos[1] - 70), (disc_pos[0] - 100, disc_pos[1] - 100)], np.int32)
    pts_nasal_inf = np.array([disc_pos, (disc_pos[0] - 60, disc_pos[1] + 70), (disc_pos[0] - 100, disc_pos[1] + 100)], np.int32)
    cv2.polylines(img, [pts_nasal_sup], False, vessel_color_vein, 3, cv2.LINE_AA)
    cv2.polylines(img, [pts_nasal_inf], False, vessel_color_vein, 3, cv2.LINE_AA)
    
    return img

def create_normal_retina():
    img, center, radius = generate_fundus_base()
    img = add_optic_disc_and_vessels(img, disc_pos=(160, 256), disc_r=32, cup_r=11)
    # Soft gaussian to look like authentic ophthalmoscope optics
    img = cv2.GaussianBlur(img, (3, 3), 0.6)
    out_path = SAMPLE_DIR / "normal_retina.jpg"
    cv2.imwrite(str(out_path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Created {out_path}")

def create_diabetic_retinopathy():
    img, center, radius = generate_fundus_base()
    img = add_optic_disc_and_vessels(img, disc_pos=(160, 256), disc_r=32, cup_r=12)
    
    # Add hard exudates (bright yellowish clusters near fovea)
    np.random.seed(42)
    for _ in range(45):
        ex_x = np.random.randint(230, 360)
        ex_y = np.random.randint(200, 310)
        cv2.circle(img, (ex_x, ex_y), np.random.randint(2, 5), (120, 240, 255), -1)
        
    # Add microaneurysms and dot hemorrhages (dark red sharp dots)
    for _ in range(60):
        h_x = np.random.randint(180, 420)
        h_y = np.random.randint(140, 380)
        cv2.circle(img, (h_x, h_y), np.random.randint(2, 4), (5, 12, 90), -1)
        
    # Add blot hemorrhage
    cv2.ellipse(img, (270, 340), (14, 8), 25, 0, 360, (5, 10, 85), -1)
    cv2.ellipse(img, (330, 190), (11, 6), -35, 0, 360, (5, 10, 85), -1)
    
    img = cv2.GaussianBlur(img, (3, 3), 0.5)
    out_path = SAMPLE_DIR / "diabetic_retinopathy.jpg"
    cv2.imwrite(str(out_path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Created {out_path}")

def create_glaucoma_fundus():
    img, center, radius = generate_fundus_base()
    # Enlarged pale optic cup (Cup-to-Disc ratio ~ 0.78)
    img = add_optic_disc_and_vessels(img, disc_pos=(160, 256), disc_r=36, cup_r=28)
    # Extra pallor
    cv2.circle(img, (160, 256), 26, (210, 245, 255), -1)
    
    img = cv2.GaussianBlur(img, (3, 3), 0.5)
    out_path = SAMPLE_DIR / "glaucoma_fundus.jpg"
    cv2.imwrite(str(out_path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Created {out_path}")

def create_cataract_eye():
    size = 512
    img = np.zeros((size, size, 3), dtype=np.uint8)
    center = (size // 2, size // 2)
    
    # Sclera / iris background
    cv2.circle(img, center, 210, (190, 205, 215), -1) # Sclera
    cv2.circle(img, center, 140, (70, 95, 110), -1)   # Hazel-blue Iris
    # Dense cataract opacification in pupil
    cv2.circle(img, center, 65, (160, 185, 195), -1)  # Cloudy lens nucleus
    # Cortical spokes
    for angle in range(0, 360, 30):
        rad = np.radians(angle)
        x2 = int(center[0] + 55 * np.cos(rad))
        y2 = int(center[1] + 55 * np.sin(rad))
        cv2.line(img, center, (x2, y2), (210, 225, 235), 4)
        
    img = cv2.GaussianBlur(img, (7, 7), 2.0)
    out_path = SAMPLE_DIR / "cataract_eye.jpg"
    cv2.imwrite(str(out_path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Created {out_path}")

def create_blurry_sample():
    img, center, radius = generate_fundus_base()
    img = add_optic_disc_and_vessels(img, disc_pos=(160, 256), disc_r=32, cup_r=12)
    # Heavy defocus motion blur to guarantee low Laplacian variance (<30)
    img = cv2.GaussianBlur(img, (45, 45), 18.0)
    out_path = SAMPLE_DIR / "blurry_sample.jpg"
    cv2.imwrite(str(out_path), img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    print(f"Created {out_path}")

if __name__ == "__main__":
    create_normal_retina()
    create_diabetic_retinopathy()
    create_glaucoma_fundus()
    create_cataract_eye()
    create_blurry_sample()
    print("All sample images created successfully!")
