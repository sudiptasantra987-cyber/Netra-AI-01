%% ========================================================================
% NETRA AI: RETINAL IMAGE PREPROCESSING & VESSEL EXTRACTION PIPELINE
% Clinical Research & Mathematical Modeling
% ========================================================================

clc; clear; close all;
fprintf('Running Netra AI Retinal Preprocessing Pipeline in MATLAB...\\n');

%% 1. Read Fundus Image
% Simulates loading digital fundus photograph (ODIR/Messidor dataset format)
img_file = '../backend/sample_images/normal_retina.jpg';
if exist(img_file, 'file') == 2
    I = imread(img_file);
else
    I = imread('peppers.png'); % Fallback test image
end

figure('Name', 'Netra AI Preprocessing Stages', 'Position', [100, 100, 1100, 650]);
subplot(2, 3, 1);
imshow(I);
title('1. Raw Ocular Fundus Input');

%% 2. Green Channel Isolation
% The green channel exhibits maximal absorption difference between 
% blood vessels (hemoglobin) and retinal background pigment epithelium.
G = I(:, :, 2);
subplot(2, 3, 2);
imshow(G);
title('2. Green Channel Extraction');

%% 3. Contrast Limited Adaptive Histogram Equalization (CLAHE)
% Amplifies local micro-contrast of microaneurysms without over-amplifying noise
G_clahe = adapthisteq(G, 'ClipLimit', 0.025, 'Distribution', 'rayleigh', 'NumTiles', [8 8]);
subplot(2, 3, 3);
imshow(G_clahe);
title('3. Rayleigh CLAHE Equalization');

%% 4. Bilateral Edge-Preserving Denoising
G_denoised = imbilatfilt(G_clahe, 150, 3.5);
subplot(2, 3, 4);
imshow(G_denoised);
title('4. Bilateral Edge-Preserving Filter');

%% 5. Multidirectional Gabor Filtering for Retinal Vasculature
wavelengths = [3 5 8];
orientations = 0:30:150;
gaborArray = gabor(wavelengths, orientations);
[gaborMag, ~] = imgaborfilt(G_denoised, gaborArray);
vessel_energy = sum(gaborMag, 3);
vessel_norm = mat2gray(vessel_energy);

subplot(2, 3, 5);
imshow(vessel_norm);
title('5. Gabor Filtered Vessel Energy');

%% 6. Morphological Binarization & Vasculature Segmentation
vessel_mask = imbinarize(vessel_norm, 'adaptive', 'Sensitivity', 0.58);
vessel_clean = bwareaopen(vessel_mask, 35);

subplot(2, 3, 6);
imshow(vessel_clean);
title('6. Segmented Retinal Vasculature Tree');

fprintf('Preprocessing Pipeline Executed Successfully.\\n');
