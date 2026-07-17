# 👋 SignBridge AI

> An intelligent, real-time sign language translation platform bridging the communication gap between the Deaf and hearing communities using client-side WebAssembly, TensorFlow.js, and Google Gemini.

---

## 🚀 Key Features

*   **Real-Time Hand Gesture Classification**: Client-side MediaPipe HandLandmarker WASM + TensorFlow.js neural network classifying 27 distinct classes (A-Z fingerspelling + Space key).
*   **Scale & Translation-Invariant Normalization**: Math-calibrated coordinate pre-processing (wrist-centered offset, middle-knuckle scale division) ensuring rock-solid predictions regardless of hand size or screen positioning.
*   **Adaptive signing Speed Calibration**: Dynamic sliding majority-voting buffer that calibrates key commitment thresholds (ranging from 4 to 12 frames) based on real-time hand velocity tracking.
*   **Anti-Flicker Confusable Filter**: Calibrated confidence filtering ($>80\%$) and class-distribution variance evaluation to eliminate flickering and letter hallucinations (e.g. `I`/`T`, `D`/`P`).
*   **Zero-Cost Smart Sentence Enhancement**: Automatic typo correction and grammar parsing utilizing dynamically discovered Google Gemini LLMs over secure Supabase Edge Functions.
*   **Multi-Lingual Translation & Speech Synthesis**: Direct voice and text translation into **Tamil, English, Hindi, Spanish, French, German, Malayalam, Telugu, and Kannada** utilizing browser-native Web Speech fallbacks.
*   **GDPR-Compliant Local Session Mode**: Guest-mode fallback allowing complete camera capture, translation, and localized history caching without requiring database accounts.
*   **Offline-Capable Emergency Broadcasts**: Card grid of common emergency phrases utilizing local pre-cached audio rendering for maximum accessibility under zero network conditions.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19 + Vite 8 (Vanilla CSS styling + Outfit & Inter typography)
*   **Hand Landmark Tracking**: `@mediapipe/tasks-vision` (Vision WASM engine)
*   **Deep Learning Classifier**: TensorFlow.js (Dense Multilayer Perceptron)
*   **Database & Authentication**: Supabase
*   **Translation & Audio Backend**: Supabase Edge Functions (Deno Deploy)
*   **LLM Core**: Google Gemini API (with automatic model-retry loop and structured output schemas)

---

## 📁 Directory Structure

```
├── data/
│   ├── dataset - Gesture Speech/   # Raw image dataset (Letters a-z + Space symbol "{")
│   └── isl-landmarks/              # Extracted landmarks (including Normalized_Gesture_Landmarks.csv)
├── scripts/
│   ├── extract_normalized_landmarks.py   # MediaPipe pipeline for batch image coordinate extraction
│   ├── train-normalized-model.cjs        # TensorFlow.js MLP model training script (27-classes output)
│   └── save_landmarks_server.cjs         # Local HTTP receiver server for coordinates compilation
├── public/
│   ├── model/                      # Compiled TFJS neural network model.json & weights
│   ├── audio/                      # Local pre-cached emergency broadcast audio files
│   └── extract.html                # Interactive browser-based landmark extraction page
├── src/
│   ├── components/
│   │   ├── CameraTranslator.jsx    # Realtime webcam handler, normalizer, and TFJS inference loop
│   │   ├── LandmarkOverlay.jsx     # Canvas element rendering landmarks skeletons over video feed
│   │   └── ShellLayout.jsx         # Responsive sidebar & sticky bottom navigation layout shell
│   ├── pages/
│   │   ├── MainTranslator.jsx      # Translation board, history logs, and Gemini Edge integration
│   │   ├── History.jsx             # Database/Local conversation log viewer & speech playback
│   │   ├── Emergency.jsx           # pre-cached spoken emergency phrase grid
│   │   └── settings/               # System theme, text sizes, and Google Cloud speech controls
```

---

## ⚙️ Configuration & Environment Variables

Copy the example environment configuration:
```bash
cp .env.example .env
```

Define the following environment variables in `.env`:

| Variable | Description | Example / How to Get |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project API endpoint URL | `https://hsutptvfxqubrlyaarrc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public publishable API key | Supabase API Settings Dashboard |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key | Google AI Studio Developer Console |

---

## 💻 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/signbridge-ai.git
cd signbridge-ai
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧠 Model Pipeline: Landmark Extraction & Retraining

To rebuild, extract, or retrain the classifier model using the raw image dataset:

### 1. Extract Normalized Coordinates
Start the temporary local file-saving server:
```bash
node scripts/save_landmarks_server.cjs
```
Open **`http://localhost:5173/extract.html`** in your browser. This will automatically process the raw images in `data/dataset - Gesture Speech/`, run MediaPipe HandLandmarker, normalize the coordinates, and POST the compiled dataset to the local server, saving it at `data/isl-landmarks/Normalized_Gesture_Landmarks.csv`.

### 2. Train the TensorFlow.js Model
Execute the Node retraining pipeline:
```bash
node scripts/train-normalized-model.cjs
```
This trains a 3-layer MLP classifier for 30 epochs on the normalized dataset and outputs the model binaries (`model.json`, `group1-shard1of1.bin`) directly to `public/model/` for immediate client-side inference.

---

## 📦 Deployment to GitHub Pages

The project contains a fully automated, reusable deployment batch script:

```bash
# Execute the deployment sequence
deploy.bat
```

This script automatically verifies the production build (`npm run build`), queries your repository's remote URL configuration, initializes a clean, localized environment inside `/dist`, commits the compiled assets, and force-pushes them to the `gh-pages` branch.

---

## 🤝 GDPR & Accessibility

SignBridge AI is designed with accessibility and privacy first:
*   **Privacy & Data Deletion**: Users can export their entire translation history to a `.txt` file or delete it permanently from their profile/history dashboard.
*   **Local Processing**: Video landmark processing and TF.js predictions run entirely client-side. No video frames, camera inputs, or raw user metrics are transmitted to any server.
*   **Contrast & Text Customization**: High-contrast styles (WCAG AAA compliant) and scalable text configurations can be updated in real-time under accessibility settings.
