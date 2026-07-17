import os
import sys
import json

# Check for required python libraries and print install instructions if missing
try:
    import cv2
    import numpy as np
    import mediapipe as mp
    import tensorflow as tf
except ImportError as e:
    missing_pkg = str(e).split("'")[-2]
    print(f"Error: Missing required library '{missing_pkg}'.")
    print("Please install the dependencies by running the following command:")
    print("  pip install opencv-python numpy mediapipe tensorflow tensorflowjs")
    sys.exit(1)

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Masking
from tensorflow.keras.utils import to_categorical

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'ProcessedData_vivit')
MODEL_SAVE_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'word_model')
MAX_FRAMES = 40  # Pad or truncate video frames to a fixed length of 40
FEATURE_DIM = 127 # 1 (uses_two_hands) + 63 (left hand landmarks) + 63 (right hand landmarks)

def extract_landmarks_from_video(video_path, landmarker):
    """
    Reads a video frame-by-frame and extracts hand landmark coordinates.
    Returns a sequence of shape (num_frames, FEATURE_DIM).
    """
    cap = cv2.VideoCapture(video_path)
    sequence = []
    
    # Initialize MediaPipe Hands utility
    mp_hands = mp.solutions.hands
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert frame color space for MediaPipe (BGR -> RGB)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = landmarker.process(rgb_frame)
        
        # Format landmarks to match our 127-dimensional vector format
        uses_two_hands = 0.0
        left_hand = [-1.0] * 63
        right_hand = [-1.0] * 63
        
        if results.multi_hand_landmarks:
            uses_two_hands = 1.0 if len(results.multi_hand_landmarks) > 1 else 0.0
            
            for idx, hand_lms in enumerate(results.multi_hand_landmarks):
                # Retrieve handedness (Left or Right)
                handedness = results.multi_handedness[idx].classification[0].label
                
                coords = []
                for lm in hand_lms.landmark:
                    coords.extend([lm.x, lm.y, lm.z])
                
                if handedness == 'Left':
                    left_hand = coords
                else:
                    right_hand = coords
                    
        frame_features = [uses_two_hands] + left_hand + right_hand
        sequence.append(frame_features)
        
    cap.release()
    return np.array(sequence)

def pad_or_truncate_sequence(sequence):
    """
    Pads or truncates a frame sequence to fixed MAX_FRAMES length.
    """
    num_frames = len(sequence)
    if num_frames == 0:
        return np.zeros((MAX_FRAMES, FEATURE_DIM))
        
    if num_frames > MAX_FRAMES:
        # Downsample or truncate
        return sequence[:MAX_FRAMES]
    else:
        # Zero padding
        padding = np.zeros((MAX_FRAMES - num_frames, FEATURE_DIM))
        return np.vstack([sequence, padding])

def process_dataset():
    """
    Processes the entire raw sign video dataset and compiles sequence features.
    """
    print(f"Loading dataset from: {os.path.abspath(DATA_DIR)}")
    
    mp_hands = mp.solutions.hands
    landmarker = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Get sorted list of class directories (76 words)
    classes = sorted([d for d in os.listdir(DATA_DIR) if os.path.isdir(os.path.join(DATA_DIR, d))])
    print(f"Discovered {len(classes)} classes.")
    
    X = []
    y = []
    
    for label_idx, class_name in enumerate(classes):
        class_path = os.path.join(DATA_DIR, class_name)
        video_files = [f for f in os.listdir(class_path) if f.lower().endswith(('.mov', '.mp4', '.avi'))]
        print(f"Processing class '{class_name}' ({label_idx + 1}/{len(classes)}) - Found {len(video_files)} videos...")
        
        for video_file in video_files:
            video_path = os.path.join(class_path, video_file)
            try:
                raw_seq = extract_landmarks_from_video(video_path, landmarker)
                padded_seq = pad_or_truncate_sequence(raw_seq)
                X.append(padded_seq)
                y.append(label_idx)
            except Exception as e:
                print(f"Warning: Failed to process {video_file}: {e}")
                
    landmarker.close()
    return np.array(X), np.array(y), classes

def build_lstm_model(num_classes):
    """
    Defines Keras LSTM sequence classification architecture.
    """
    model = Sequential([
        Masking(mask_value=0.0, input_shape=(MAX_FRAMES, FEATURE_DIM)), # Ignore zero-padded frames
        LSTM(64, return_sequences=True, activation='relu'),
        LSTM(128, return_sequences=False, activation='relu'),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def main():
    if not os.path.exists(DATA_DIR):
        print(f"Error: ProcessedData_vivit directory not found at: {DATA_DIR}")
        sys.exit(1)
        
    # 1. Process videos into coordinate sequence tensors
    X, y, classes = process_dataset()
    print(f"Dataset compiled. X shape: {X.shape}, y shape: {y.shape}")
    
    # 2. Save class labels map for the frontend client app
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    with open(os.path.join(MODEL_SAVE_DIR, 'class_labels.json'), 'w') as f:
        json.dump(classes, f, indent=2)
    print("Saved class labels mapping to public/word_model/class_labels.json")
    
    # One-hot encode targets
    num_classes = len(classes)
    y_one_hot = to_categorical(y, num_classes=num_classes)
    
    # Shuffle dataset
    indices = np.arange(X.shape[0])
    np.random.shuffle(indices)
    X = X[indices]
    y_one_hot = y_one_hot[indices]
    
    # 3. Build and train LSTM model
    model = build_lstm_model(num_classes)
    model.summary()
    
    print("Training word-level sign language LSTM classifier...")
    model.fit(
        X, y_one_hot,
        epochs=35,
        batch_size=32,
        validation_split=0.15
    )
    
    # 4. Save trained Keras model
    keras_model_path = os.path.join(MODEL_SAVE_DIR, 'word_model.h5')
    model.save(keras_model_path)
    print(f"Keras model saved to: {keras_model_path}")
    
    # 5. Convert to TF.js format using tensorflowjs_converter
    print("Converting Keras model to TensorFlow.js layers format...")
    os.system(f"tensorflowjs_converter --input_format=keras {keras_model_path} {MODEL_SAVE_DIR}")
    print(f"TF.js model compiled and saved to: {MODEL_SAVE_DIR}")

if __name__ == '__main__':
    main()
