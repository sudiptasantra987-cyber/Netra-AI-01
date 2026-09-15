import cv2
import numpy as np
from PIL import Image
import io
from app.core.config import settings
from app.models.schema import QualityMetrics

def assess_image_quality(image_bytes: bytes) -> QualityMetrics:
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img_bgr is None:
        return QualityMetrics(
            sharpness_score=0.0,
            brightness_score=0.0,
            contrast_score=0.0,
            noise_level=100.0,
            resolution_ok=False,
            width=0,
            height=0,
            composite_quality=0.0,
            is_suitable=False,
            status_label="Insufficient Quality",
            rejection_reasons=["File could not be decoded as a valid image."],
            guidance="Please upload a valid JPG or PNG eye photograph."
        )

    height, width = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # In fundus photography, black mask surrounds the circular aperture
    retina_mask = gray > 12
    if np.count_nonzero(retina_mask) > (height * width * 0.2):
        active_pixels = gray[retina_mask]
    else:
        active_pixels = gray.flatten()
        retina_mask = np.ones((height, width), dtype=bool)

    # 1. Sharpness / Blur Detection via Laplacian Variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    # Masked Laplacian variance over the retinal area
    laplacian_var = float(np.var(laplacian[retina_mask]))
    sharpness_score = min(100.0, max(0.0, (laplacian_var / 80.0) * 100.0))
    
    # 2. Brightness Assessment (Mean luminance of retinal field)
    mean_luminance = float(np.mean(active_pixels))
    brightness_score = min(100.0, max(0.0, (mean_luminance / 255.0) * 100.0))
    
    # 3. Contrast Assessment (RMS Contrast of retinal field)
    contrast_val = float(np.std(active_pixels))
    contrast_score = min(100.0, max(0.0, (contrast_val / 50.0) * 100.0))
    
    # 4. Noise Estimation
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    noise_residual = np.abs(gray.astype(np.float32) - blurred.astype(np.float32))
    noise_level = float(min(100.0, (np.mean(noise_residual[retina_mask]) / 12.0) * 100.0))
    
    # 5. Resolution check
    resolution_ok = (width >= settings.MIN_RESOLUTION[0] and height >= settings.MIN_RESOLUTION[1])
    
    # Rejection Logic
    rejection_reasons = []
    
    # Threshold for blur: under 25 is unreadable/blurry
    if laplacian_var < 25.0:
        rejection_reasons.append(f"Image is significantly blurry (Sharpness: {sharpness_score:.1f}%). Focus is inadequate for microvascular analysis.")
    
    if mean_luminance < 25.0:
        rejection_reasons.append("Image is severely underexposed/dark. Retinal fundus structures are not discernible.")
    elif mean_luminance > 235.0:
        rejection_reasons.append("Image is overexposed/glare washed out. Detail is clipped.")
        
    if contrast_val < 18.0:
        rejection_reasons.append("Image has very low contrast. Optic disc and vessels cannot be segmented reliably.")
        
    if not resolution_ok:
        rejection_reasons.append(f"Resolution ({width}x{height}) is below minimum requirement of {settings.MIN_RESOLUTION[0]}x{settings.MIN_RESOLUTION[1]}.")

    # Composite Quality Score (Weighted combination)
    w_sharpness = 0.40
    w_contrast = 0.25
    w_brightness = 0.20
    w_noise = 0.15
    
    # Ideal brightness is around 35% - 75%
    brightness_penalty = 1.0 - (abs(brightness_score - 50.0) / 50.0)
    brightness_quality = max(0.0, brightness_penalty * 100.0)
    noise_quality = max(0.0, 100.0 - noise_level)
    
    composite_quality = round(
        (sharpness_score * w_sharpness) +
        (contrast_score * w_contrast) +
        (brightness_quality * w_brightness) +
        (noise_quality * w_noise),
        1
    )
    
    is_suitable = len(rejection_reasons) == 0 and composite_quality >= 50.0
    
    if composite_quality >= 80.0 and is_suitable:
        status_label = "Excellent"
        guidance = "Image quality is optimal. High confidence diagnostic feature extraction possible."
    elif is_suitable:
        status_label = "Suitable"
        guidance = "Image quality is acceptable for clinical AI screening."
    else:
        status_label = "Insufficient Quality"
        if laplacian_var < settings.MIN_LAPLACIAN_VAR:
            guidance = "Image is too blurry. Please stabilize your camera or adjust fundus attachment focus, then capture again."
        elif mean_luminance < settings.MIN_BRIGHTNESS:
            guidance = "Image is too dark. Increase illumination or capture in a well-lit environment without shadowing."
        elif mean_luminance > settings.MAX_BRIGHTNESS:
            guidance = "Excessive glare detected. Avoid direct flash reflection onto the cornea/lens."
        else:
            guidance = "Quality parameters fall below clinical threshold. Please recapture the eye image."
            
    return QualityMetrics(
        sharpness_score=round(sharpness_score, 1),
        brightness_score=round(brightness_score, 1),
        contrast_score=round(contrast_score, 1),
        noise_level=round(noise_level, 1),
        resolution_ok=resolution_ok,
        width=width,
        height=height,
        composite_quality=composite_quality,
        is_suitable=is_suitable,
        status_label=status_label,
        rejection_reasons=rejection_reasons,
        guidance=guidance
    )
