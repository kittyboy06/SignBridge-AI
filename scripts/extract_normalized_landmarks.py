import os
import math
import csv
from PIL import Image
import numpy as np
import mediapipe as mp

# Paths
DATASET_DIR = "d:/Projects/Hackathon/SignBridge AI/data/dataset - Gesture Speech"
OUTPUT_CSV = "d:/Projects/Hackathon/SignBridge AI/data/isl-landmarks/Normalized_Gesture_Landmarks.csv"

# Map folders to labels
# a-z -> 0-25, { -> 26 (Space)
ALPHABET = "abcdefghijklmnopqrstuvwxyz{"
label_map = {char: idx for idx, char in enumerate(ALPHABET)}

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=2,
    min_detection_confidence=0.5
)

def normalize_hand_landmarks(landmarks):
    # 1. Translate relative to wrist (landmark 0)
    wrist = landmarks[0]
    translated = []
    for lm in landmarks:
        translated.append([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
    
    # 2. Scale relative to distance between Wrist (0) and Middle Knuckle (9)
    dx = translated[9][0] - translated[0][0]
    dy = translated[9][1] - translated[0][1]
    dz = translated[9][2] - translated[0][2]
    dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    
    if dist > 0:
        normalized = [[x/dist, y/dist, z/dist] for x, y, z in translated]
    else:
        normalized = translated
        
    return normalized

def main():
    print("Starting landmarks extraction from raw image dataset using PIL...")
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    
    csv_rows = []
    
    # Loop over alphabet folders
    for char in ALPHABET:
        folder_path = os.path.join(DATASET_DIR, char)
        if not os.path.isdir(folder_path):
            print(f"Warning: Folder not found: {folder_path}")
            continue
            
        label = label_map[char]
        image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Processing class '{char}' (Label: {label}) - Found {len(image_files)} images...")
        
        # Limit to max 400 images per class to keep it fast and balanced
        images_to_process = image_files[:400]
        
        success_count = 0
        for img_name in images_to_process:
            img_path = os.path.join(folder_path, img_name)
            try:
                img_pil = Image.open(img_path)
                if img_pil.mode != 'RGB':
                    img_pil = img_pil.convert('RGB')
                img_np = np.array(img_pil)
                
                results = hands.process(img_np)
                
                if results.multi_hand_landmarks:
                    uses_two_hands = 1.0 if len(results.multi_hand_landmarks) > 1 else 0.0
                    left_hand_coords = [-1.0] * 63
                    right_hand_coords = [-1.0] * 63
                    
                    for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                        handedness = results.multi_handedness[idx].classification[0].label
                        normalized = normalize_hand_landmarks(hand_landmarks.landmark)
                        
                        # Flatten coords
                        coords_flat = []
                        for pt in normalized:
                            coords_flat.extend(pt)
                            
                        # MediaPipe labels relative to selfie/mirror view
                        # We map them to our standard format
                        if handedness == 'Left':
                            left_hand_coords = coords_flat
                        else:
                            right_hand_coords = coords_flat
                    
                    # Construct feature row: label, uses_two_hands, left_hand (63), right_hand (63)
                    row = [label, uses_two_hands] + left_hand_coords + right_hand_coords
                    csv_rows.append(row)
                    success_count += 1
            except Exception as e:
                # Silently ignore load errors
                continue
                
        print(f"Successfully extracted {success_count}/{len(images_to_process)} landmarks for class '{char}'")
        
    # Write to CSV
    print(f"Writing {len(csv_rows)} rows to {OUTPUT_CSV}...")
    with open(OUTPUT_CSV, 'w', newline='') as f:
        writer = csv.writer(f)
        # Header
        header = ["target", "uses_two_hands"]
        for i in range(21):
            header.extend([f"left_hand_x_{i}", f"left_hand_y_{i}", f"left_hand_z_{i}"])
        for i in range(21):
            header.extend([f"right_hand_x_{i}", f"right_hand_y_{i}", f"right_hand_z_{i}"])
        writer.writerow(header)
        writer.writerows(csv_rows)
        
    print("Landmarks extraction completed successfully!")

if __name__ == "__main__":
    main()
