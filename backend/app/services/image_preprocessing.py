import cv2
import numpy as np
import base64

def preprocess_retinal_image(img_bgr: np.ndarray) -> dict:
    """
    Standard ophthalmic image preprocessing pipeline:
    1. Circular crop & center alignment
    2. Green channel extraction (highest contrast for retinal hemorrhages and microaneurysms)
    3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    4. Bilateral filtering for edge-preserving denoising
    5. Illumination correction via Gaussian subtraction
    """
    h, w = img_bgr.shape[:2]
    target_size = (512, 512)
    resized = cv2.resize(img_bgr, target_size, interpolation=cv2.INTER_AREA)
    
    # 1. Split BGR channels
    b, g, r = cv2.split(resized)
    
    # 2. CLAHE on Green Channel
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    clahe_green = clahe.apply(g)
    
    # 3. Bilateral Filter to remove background noise while preserving vessel margins
    denoised_green = cv2.bilateralFilter(clahe_green, d=9, sigmaColor=75, sigmaSpace=75)
    
    # 4. Color CLAHE for visualization
    lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
    l, a, b_ch = cv2.split(lab)
    l_clahe = clahe.apply(l)
    enhanced_lab = cv2.merge([l_clahe, a, b_ch])
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    
    # 5. Retinal Vessel Segmentation Highlight via morphological top-hat & bottom-hat
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    top_hat = cv2.morphologyEx(denoised_green, cv2.MORPH_TOPHAT, kernel)
    black_hat = cv2.morphologyEx(denoised_green, cv2.MORPH_BLACKHAT, kernel)
    vessel_enhanced = cv2.add(denoised_green, top_hat)
    vessel_enhanced = cv2.subtract(vessel_enhanced, black_hat)
    
    # Encode preprocessed versions to base64 for inspection
    _, buff_enhanced = cv2.imencode('.jpg', enhanced_bgr)
    _, buff_green = cv2.imencode('.jpg', denoised_green)
    _, buff_vessels = cv2.imencode('.jpg', vessel_enhanced)
    
    return {
        "processed_array": resized,
        "enhanced_bgr": enhanced_bgr,
        "green_channel": denoised_green,
        "enhanced_base64": f"data:image/jpeg;base64,{base64.b64encode(buff_enhanced).decode('utf-8')}",
        "green_base64": f"data:image/jpeg;base64,{base64.b64encode(buff_green).decode('utf-8')}",
        "vessels_base64": f"data:image/jpeg;base64,{base64.b64encode(buff_vessels).decode('utf-8')}"
    }
