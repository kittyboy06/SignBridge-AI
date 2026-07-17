# SignBridge AI — Feature, Screen & Model Spec

## 1. Features (by module) — detailed

### Authentication
- **Login (email + password)** via Supabase Auth — standard email/password, with option to add Google OAuth later since it's a quick Supabase toggle
- **Signup** — email, password, confirm password, basic validation (email format, password strength), email verification step
- **Guest mode** — skip login entirely and land straight on the Main Translator screen; app works fully, but conversation history isn't saved across sessions (or is saved to `localStorage`/session-only, not Supabase) — this is the "without login" path from your notes
- **Session persistence** — Supabase session token stored so returning users don't have to log in every visit
- **Profile avatar + display name** in the top-right nav (matches your mockup's "Priya" avatar) — click opens Profile screen
- **Sign out** flow from Settings or profile dropdown

### Sign → Text
- **Live camera feed** — `<video>` element pulling from `getUserMedia`, mirrored horizontally (selfie-style, like the mockup)
- **Camera facing mode (front/back) — two-way communication support**:
  - **Front camera ("Self" mode)** — default on desktop/laptop webcams and when a user signs to translate *for someone else reading the screen*. Video is mirrored (selfie-style) so the signer sees themselves naturally.
  - **Back camera ("Point" mode)** — on mobile, detect via `navigator.mediaDevices` + request `facingMode: { exact: "environment" }`. Used when a hearing user points their phone *at another person* signing to them. Video is **not** mirrored here (mirroring a back-camera feed would look wrong/backwards).
  - **Camera flip toggle button** on the Main screen (visible only on mobile, since desktops typically have one front-facing webcam) to switch between the two.
  - Detect mobile vs desktop via `navigator.userAgent` or screen width, and default to back camera automatically on mobile — since the more common real-world case is a hearing person pointing their phone at a signer, not a deaf user signing to their own screen.
- **Audio output via play button** — critical for back-camera/"Point" mode: the person holding the phone is watching the *signer*, not their own screen, so a prominent, easy-to-tap **play button** on the translation card lets them trigger audio playback on demand rather than the app auto-speaking every detection (avoids overlapping/interrupting audio if signs come in quickly, and keeps the user in control).
  - Play button should be large and reachable by thumb in back-camera mode specifically (bottom of screen, not buried in a side panel), since the user's attention is on the signer, not precise screen navigation.
  - Same play button pattern applies in front-camera/"Self" mode too — consistent control across both modes, no hidden auto-play behavior to guess at.
  - Optional: a **repeat/replay button** next to play, so if the audio was missed the user can tap again without re-triggering detection.
- **Hand landmark overlay** (optional, toggle-able) — draws the 21-point skeleton on top of the video feed for debugging/demo purposes, can be hidden in a "clean" viewing mode
- **Real-time gesture classification** — landmarks feed into the TF.js classifier every frame (or throttled, e.g. every 200–300ms to save CPU), outputs predicted sign + confidence score
- **Live caption display** — shows the current recognized word/letter as large readable text, updates as new signs are detected
- **Confidence score UI** — circular progress or percentage badge (like the 98% in your mockup); should visibly change color/warn below a threshold (e.g. <70%) rather than showing a falsely confident number
- **"No hand detected" state** — replaces caption with a neutral prompt ("Show your hand to the camera") instead of a blank/broken UI
- **Sign buffering/sentence building** — since MVP is static signs, you likely want detected signs to accumulate into a caption string (e.g. "hold" a sign for X frames before committing it as confirmed, to avoid flickering/duplicate letters) — this is a real UX challenge worth prototyping early
- **MVP scope**: static alphabet + curated word/phrase set (see Models section) — not full continuous ISL grammar

### Language Translation
- **Source ↔ target language dropdowns** with swap icon (exactly like your mockup: English ⇄ Tamil)
- **Auto-translate on caption commit** — once a sign/phrase is confirmed, it's automatically sent for translation (no manual "translate" button needed, keeps it real-time)
- **Translated text display panel** — separate from the live caption, shows the target-language text
- **Multi-language support** — architecture should support adding more target languages later (Hindi, Telugu, etc.) without redesigning the UI, just extending the dropdown list

### Text → Speech
- **Play button** on the *translated* text specifically (not just the detected English caption — this was the gap I flagged earlier: a Tamil speaker needs to hear Tamil, not English)
- **Voice settings screen**: choose voice (male/female), and where supported by Google Cloud TTS, choose between Standard/WaveNet/Neural2 voice tiers, adjust speaking rate and pitch
- **Waveform/audio player UI** — visual waveform bar (as in mockup) while audio plays, matches a polished "voice message" feel
- **Auto-play toggle** — option to auto-speak every translation as it comes in, vs. manual tap-to-play (auto-play may be preferable for an accessibility-first flow so the user doesn't have to look at the screen)

### Mobile Responsive
- Since this is React (not native), "mobile responsive" means a fully responsive **web/PWA layout** — camera panel and translation panel stack vertically on narrow screens instead of the two-column desktop layout in your mockup
- Add-to-homescreen / PWA manifest so it behaves like an installed app on phones
- Camera permission handling needs to work correctly across mobile Safari/Chrome (getUserMedia quirks differ by browser — worth testing early, not just at the end)

### User History & Data
- **Conversation history list** — timestamped entries of past sign→text→translation exchanges (matches the right panel in your mockup)
- **Playback** — tap an entry to replay its TTS audio (may require re-calling TTS API if audio isn't cached, or store the audio URL from Google Cloud TTS response)
- **Search/filter** by date or keyword
- **Export/clear history** — GDPR-style user control over their own data
- Guest mode: history is session-only or device-local, not persisted to Supabase (ties back to Authentication scope decision)

### Emergency
- **Pre-loaded emergency phrases** as tappable cards/grid ("I need help", "Call an ambulance", "Where is the hospital", "I am deaf/hard of hearing", etc.)
- **One-tap sign→speech** — since these are fixed, known phrases (not live camera detection), this should use **pre-generated cached audio** (Google Cloud TTS called once at build/setup time, not live every tap) so it works instantly and even offline
- **Optional escalation features** (scope decision, not required for MVP): share live location via link, auto-dial/SMS a saved emergency contact — flag these as v2 stretch goals since they involve device permissions (geolocation, SMS) beyond the core sign-translation scope

### Onboarding
- **Splash/tutorial** — 2–3 step walkthrough explaining what the app does and how to use the camera, shown only on first launch
- **Permissions request** — camera access prompt with a clear explanation *before* the browser's native permission popup (improves grant rates)
- **"Start" button** — transitions into the Main Translator screen after tutorial + permissions are done

---

## 2. Screens — detailed

1. **Splash / Onboarding Tutorial**
   - Purpose: first-run explainer, sets expectations before camera access
   - Elements: app logo/name, 2–3 swipeable/steppable illustration cards ("Point your camera at your hands", "We translate signs to text and speech", "Works in Tamil and more"), Skip + Next buttons
   - Navigation: → Permissions Screen (or straight to Main if permissions already granted from a prior visit)

2. **Permissions Screen**
   - Purpose: request camera access with context, avoid a jarring blind browser popup
   - Elements: short explanation text, "Allow Camera Access" button (triggers `getUserMedia` prompt), fallback messaging if denied ("You can enable this later in browser settings")
   - Navigation: → Login/Guest choice, or straight to Main if returning user

3. **Login Screen**
   - Elements: email field, password field, "Forgot password" link, Login button, "Continue as Guest" link, "Don't have an account? Sign up" link
   - Navigation: → Main Translator (on success) or Signup Screen

4. **Signup Screen**
   - Elements: name, email, password, confirm password, terms checkbox, Sign Up button
   - Navigation: → email verification notice → Login or straight into Main

5. **Guest Entry**
   - Not a full screen necessarily — a button/flow off the Login screen that skips straight to Main Translator with a banner/badge indicating "Guest mode — history won't be saved. Log in to save your conversations."

6. **Main / Live Translator Screen** (core screen — matches your mockup)
   - Left panel: live camera feed with "LIVE" badge, detecting status indicator, fullscreen toggle, **camera flip button (front/back, mobile only)**
   - Below camera: Live Caption card with confidence score and language dropdown
   - Right panel: Translation card (source/target language + swap, translated text, play button), Conversation History preview (last 3 entries, "View all" link)
   - Top bar: app logo, greeting ("Hello, [Name]"), theme toggle, language quick-switch, profile avatar
   - Bottom: dismissible tip banner ("Position your hands clearly in front of the camera")
   - Sidebar nav: Live Translator, Conversations, History, Emergency, Settings
   - **Mobile back-camera mode**: play button is large and thumb-reachable near the bottom of the screen, live caption text stays visible but the play button is the primary interaction (user is watching the signer, not reading precisely) — no audio plays without the user tapping

7. **Language Selection Modal/Screen**
   - Elements: searchable list of supported languages, flag/label per language, selected-state checkmark
   - Can be a dropdown (as in mockup) rather than a full separate screen — worth deciding based on how many languages you launch with

8. **Voice Settings Screen**
   - Elements: voice gender toggle, voice tier (Standard/WaveNet/Neural2) if exposing that choice, speaking rate slider, pitch slider, "Test voice" preview button

9. **Text/Caption Settings Screen**
   - Elements: font size stepper, high-contrast mode toggle, caption background opacity, auto-play toggle for TTS (off by default in both modes — user controls playback via the play button, per your latest direction)

10. **Conversation History Screen**
    - Elements: full chronological list of past exchanges, search bar, date filter, tap-to-expand/playback, delete individual entries, "Clear all" option

11. **History Detail/Playback Screen** (or expandable row instead of separate screen)
    - Elements: original detected text, translated text, replay audio button, timestamp, delete entry

12. **Emergency Screen**
    - Elements: grid of large, high-contrast tappable phrase cards, each triggering instant cached-audio playback; possibly a "Custom emergency message" option for anything not pre-loaded

13. **Settings Screen**
    - Elements: account info/edit, default language pair, theme (light/dark), notification preferences, link to Voice/Text Settings, About/version info, Sign out, Delete account

14. **Profile Screen**
    - Elements: avatar upload, display name edit, email (read-only or editable with re-verification), linked account info

15. **Error/Empty States** (shared components, not standalone screens)
    - "No hand detected" — shown in the caption card when MediaPipe reports no landmarks
    - "Low confidence" — visual warning state when classifier confidence drops below threshold
    - "No internet" — shown when translation/TTS calls fail (since those are cloud-dependent even though sign detection itself works offline)
    - "No history yet" — empty state for History screen on first use

---

## 3. Models & Technical Approach (React / Web Stack)

### Sign Detection Pipeline (in-browser, real-time)
- **MediaPipe Tasks Vision — HandLandmarker (JS)** — `@mediapipe/tasks-vision` npm package, runs entirely client-side via WASM, no server round-trip, works offline once loaded. This replaces the Android/TFLite path — same 21-keypoint landmark output as the Python repos.
- **Classifier** — same architecture idea as kinivi/MaitreeVaria (MLP on normalized landmark coordinates), but exported/converted to run via **TensorFlow.js** in the browser instead of TFLite. You can train in Python (reusing their notebooks) then convert with `tensorflowjs_converter`.
- **Dataset**: MaitreeVaria's ISL keypoint dataset (from Kaggle ISL image dataset) as your starting point — saves you from collecting data from scratch
- Runs inside a React component via `useEffect` + `<video>`/`<canvas>` refs, landmark detection loop on `requestAnimationFrame`

### Important scoping call
The repos you found (and MediaPipe-landmark approaches generally) recognize **static, isolated hand poses** — single letters/words held in a still frame. Real ISL/ASL also uses **motion, two-hand combinations, and facial expressions (non-manual markers)** as grammar. Full continuous sign-language translation is a much harder, ongoing research problem.

**Recommendation for MVP**: scope to static alphabet + a curated set of common words/phrases (the emergency phrases are a great fit for this). Don't promise "full sentence ISL translation" — that's a stretch goal, not v1.

### Translation
- **Google Cloud Translation API** — quick to integrate, broad language coverage
- **AI4Bharat IndicTrans2** — worth evaluating for better Tamil/Indian-language accuracy specifically, since generic translation APIs often handle Indian languages less naturally

### Text-to-Speech
- **Google Cloud Text-to-Speech API** only (no on-device/browser TTS fallback)
- Call from a small backend/serverless function (Supabase Edge Function or Node) rather than directly from the React client, so your API key isn't exposed in browser JS
- Supports natural Tamil (and other Indian language) voices — pick WaveNet/Neural2 voice models for better quality over standard voices
- Returns audio (MP3/OGG) → play via HTML5 `<audio>` element, matches the waveform/play-button UI in your mockup

### Frontend
- **React + Vite** (matches your usual stack)

### Backend
- **Supabase** — auth, conversation history storage, user profiles
- **Supabase Edge Function (or small Node server)** — proxies Google Cloud Translation + Google Cloud TTS calls so your Google API key stays server-side, never shipped in the React bundle

### Data flow (end to end)
```
Browser camera → MediaPipe Tasks Vision (landmarks, WASM, client-side)
→ TF.js classifier (sign→text, client-side)
→ Supabase Edge Function → Google Cloud Translation API (text→target language)
→ Supabase Edge Function → Google Cloud TTS API (text→speech audio)
→ Play audio in browser + save entry to Supabase history
```

### Note on API keys
Both Google Cloud Translation and Google Cloud TTS are paid APIs (with free tiers) that require a service account key — this key must never sit in client-side React code. Route both through your Supabase Edge Function/backend.
