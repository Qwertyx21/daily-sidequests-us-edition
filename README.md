# Daily SideQuests: Us Edition 

A private, real-time progressive web app (PWA) crafted exclusively for Two Couples. Daily SideQuests combines spontaneous photo sharing, couple missions, blind AI prompts, interactive polaroid scrapbooking, live chat, and multi-theme customization into an intimate digital space synced across both devices.

---

##  Features Overview

### 1.  Love Drops & SideQuests
* **Dual-Mode Drops**:
  *  **Photo Drops (Instant Moments)**: Snap an instant photo using your phone's camera (`Take Photo 📷`) or upload an image from your library (`Upload Photo `) to show your partner what you are up to right now. Photo Drops display directly on your partner's timeline and automatically save permanently into the shared Photo Vault.
  *  **SideQuests (Couple Missions)**: Assign personalized challenges, prompts, or timed surprise missions to your partner with optional scheduled drop times.
* **3-Mode Timeline Views**:
  * **For Me**: All active Photo Drops and SideQuests waiting for you to complete or acknowledge.
  * **Sent to {Partner}**: A live log of every Drop and SideQuest you have posted, allowing you to monitor progress and view completed Polaroids.
  * **Both of Us **: Shared AI and spontaneous couple prompts where both partners participate.
* **1-Tap Photo Acknowledgment**: When receiving a Photo Drop, the recipient can tap **"Love & Keep Photo "** in a single tap without being forced to take a photo, or choose **"Snap Photo Back "** to send a return Polaroid.
* **Snooze & Mystery Locks**: Quests can be unlocked on a schedule or revealed instantly. Snooze missions in +15m or +30m increments up to a 60-minute maximum delay budget.
* **Preloaded Secret Rewards**: Senders can attach hidden Polaroid photos and secret captions that remain sealed until the recipient completes the quest.

---

### 2.  Shared AI & Spontaneous Couple Prompts ("Both of Us ")
* **Blind Answer Reveal System**: Random AI questions and mini-challenges pop up for both partners. To preserve surprise and honesty, your partner's answer remains locked and obscured until you submit your own answer—revealing both side-by-side once both partners have answered.
* **Curated Prompt Categories**:
  *  **Deep Questions**: Meaningful conversations, relationship memories, and emotional check-ins.
  *  **Mini-Challenges**: Quick spontaneous activities you can complete together in 5 minutes.
  *  **Spicy & Sweet**: Playful flirty prompts, future daydreaming, and affectionate banter.
* **Spontaneous Prompt Dice**: Tap `Random AI Prompt ` at any time to summon a fresh prompt across both devices simultaneously.

---

### 3.  Real-Time Live Chat ("Us Chat")
* **Persistent Firebase Sync**: Messages and photos are synced instantly via Cloud Firestore snapshots; chats never disappear or reset on page refresh.
* **Partner-Centric View**: Just like WhatsApp or Instagram DMs, the chat header exclusively displays your partner's status, avatar, and active typing indicator.
* **Private Notes Scratchpad**: An isolated, private scratchpad on each device where you can secretly jot down gift ideas, surprises, or notes without them ever appearing on your partner's phone.
* **Interactive Reactions**: Long-press or tap messages to react with love emojis (💖, 🥰, 🔥, 🥺, 😂, 👏).
* **Instant Love Pings & Sparks**: Send instant haptic heart vibrations (`Ping `) or choose quick conversation sparks with one tap.
* **Chat Photo Sharing**: Attach photos directly in chat with automatic client-side compression; every photo shared is also automatically stored permanently in the Photo Vault.

---

### 4.  Love Vault & Retro Polaroid Keepsake Studio
* **Interactive Polaroid Keepsakes**: Complete challenges or capture spontaneous memories into vintage Polaroid frames with customizable washi tape designs (`rose`, `gold`, `sage`, `kraft`) and emoji stickers.
* **Full-Resolution Lightbox**: Click any memory card to open an interactive zoom lightbox.
* **Download Keepsakes**: Save generated Polaroid cards as standalone high-resolution PNG image files.
* **Cloud Storage & Local Compression**: High-resolution photos are compressed client-side before uploading, ensuring fast performance and minimal storage footprint.

---

### 5.  8 Curated Aesthetics & High-Contrast Dark Mode
* **Universal Theme Switcher**: Tap the **Themes** button in the top navigation bar to select from 8 distinct palettes:
  * **5 Daylight & Pastel Themes**:
    *  **Rosewater Cream** (Default): Editorial ivory, blush rose & sunlit gold.
    *  **Kyoto Matcha**: Serene botanical sage, oat milk & warm bamboo.
    *  **Lavender Daydream**: Dreamy lilac mist, soft wisteria & berry.
    *  **Terracotta Sunset**: Golden hour desert peach, warm clay & honey.
    *  **Amalfi Coastal**: Crisp Mediterranean linen, seafoam & azure.
  * **3 High-Contrast Dark Themes**:
    *  **Midnight Velvet**: Deep obsidian plum, luminous rose & warm gold.
    *  **Espresso Noir**: Cozy late-night cafe roast, caramel & warm cream.
    *  **Starlight Aurora**: Deep midnight sky, bioluminescent cyan & violet.
* **Zero-Glare Dark Mode**: Built with custom CSS variables ensuring every gradient card, modal, Polaroid, and text block maintains crisp readability without whitened-out or unreadable areas.
* **Quick Toggle**: Seamlessly toggle between your active light and dark themes using the `☀️` / `🌙` button.

---

### 6.  Two-Phone Privacy & Identity Lock
* **Authorized Email Whitelist**: Authentication is restricted exclusively to the two authorized Google accounts:
  * **Couple1**: `.....@gmail.com`
  * **Couple2**: `......@gmail.com`
* **Device Lock**: The signed-in Google account automatically locks the perspective of the application, guaranteeing that Couple1s phone remains locked to Couple1's view and Couple2's phone remains locked to Couple2's view.
* **Sound FX Engine**: Custom synthesized audio effects for photo captures, completed quests, chimes, and wax stamp seals (toggleable via the mute button).

---

##  GitHub Repository & Access

* **Repository URL**: `https://github.com/Qwertyx21/daily-sidequests-us-edition.git`
* **Default Branch**: `main`

### Gaining Access & Authentication
If the repository is private, you must have access granted by the repository owner (`Qwertyx21`):
1. **GitHub Account**: Provide your GitHub username to the owner to be added as a collaborator.
2. **Authentication via Personal Access Token (PAT)**:
   * Go to **GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**.
   * Generate a token with the `repo` scope enabled.
   * Use this token as your password when cloning or pushing over HTTPS.
3. **Authentication via SSH (Recommended)**:
   * Add your public SSH key (`id_ed25519.pub` or `id_rsa.pub`) to **GitHub Settings → SSH and GPG keys**.
   * Clone using the SSH URL:
     ```bash
     git clone git@github.com:Qwertyx21/daily-sidequests-us-edition.git
     ```

---

##  Step-by-Step Reconstruction Procedure

Follow these steps to reconstruct and run the entire application from scratch on a new machine.

### Prerequisites
* **Node.js**: v20.x or higher installed ([Download Node.js](https://nodejs.org/))
* **npm**: v10.x or higher (bundled with Node.js)
* **Git**: Installed and configured on your path ([Download Git](https://git-scm.com/))
* **Firebase Account**: A Google account with access to the Firebase Console ([Firebase Console](https://console.firebase.google.com/))

---

### Step 1: Clone the Repository
Clone the codebase to your local development environment:

```bash
git clone https://github.com/Qwertyx21/daily-sidequests-us-edition.git
cd daily-sidequests-us-edition
```

---

### Step 2: Install Project Dependencies
Install all required Node.js packages:

```bash
npm install
```

---

### Step 3: Firebase Project Configuration
The project is configured to use the Firebase project `couplequests-4faa5`. If you are reconstructing on the existing project or deploying to a new one:

1. **Verify `.firebaserc`**:
   Ensure `.firebaserc` points to your target Firebase project ID:
   ```json
   {
     "projects": {
       "default": "couplequests-4faa5"
     }
   }
   ```

2. **Enable Required Firebase Services** in the [Firebase Console](https://console.firebase.google.com/):
   * **Authentication**: Enable the **Google** sign-in provider. Under **Authorized domains**, make sure `localhost` and your hosting domain (e.g., `couplequests-4faa5.web.app`) are listed.
   * **Cloud Firestore**: Create a Firestore database in production mode.
   * **Firebase Storage**: Enable default bucket storage for media uploads.
   * **Firebase Hosting**: Enable hosting for static web delivery.

3. **Verify Firebase Credentials in Source**:
   Verify that [`src/firebase.ts`](src/firebase.ts) contains the corresponding Firebase project configuration:
   ```typescript
   export const firebaseConfig = {
     apiKey: "...",
     authDomain: "couplequests-4faa5.firebaseapp.com",
     projectId: "couplequests-4faa5",
     storageBucket: "couplequests-4faa5.firebasestorage.app",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

---

### Step 4: Configure Environment Variables
Create a local `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

If you plan to use Web Push Notifications (FCM):
1. In the Firebase Console, navigate to **Project Settings → Cloud Messaging → Web configuration**.
2. Click **Generate key pair** under **Web Push certificates**.
3. Copy the public key into `.env`:
   ```env
   VITE_FIREBASE_VAPID_KEY=your_public_vapid_key_here
   ```

---

### Step 5: Deploy Firestore & Storage Security Rules
Deploy the database and storage security rules to secure real-time access:

```bash
npx firebase login
npx firebase deploy --only firestore:rules,storage --project couplequests-4faa5
```

> **Note**: The security rules are maintained in [`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules). They enforce that only authenticated requests from Aaron and Vini can read and write data in the `AARON-VINI-US` room.

---

### Step 6: Run Locally for Development
To start the local development server with hot-module reloading:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

### Step 7: Build for Production & Deploy to Firebase Hosting
To compile the TypeScript / React code and deploy the live static site to Firebase Hosting:

1. **Create the production build**:
   ```bash
   npm run build
   ```
   *This compiles assets into the `dist/` directory using Vite and Tailwind CSS v4.*

2. **Deploy to Firebase Hosting**:
   ```bash
   npx firebase deploy --only hosting --project couplequests-4faa5
   ```

3. **Access the Live Production App**:
   The live application is published at:
   **[https://couplequests-4faa5.web.app](https://couplequests-4faa5.web.app)**

---

### Step 8: Installing as a Mobile PWA on Aaron & Vini's Phones

To get the full standalone mobile app experience without browser navigation bars:

#### On iPhone (Safari):
1. Open `https://couplequests-4faa5.web.app` in **Safari**.
2. Tap the **Share** button (box with an arrow pointing up) at the bottom.
3. Scroll down and tap **Add to Home Screen**.
4. Name it `Daily SideQuests` and tap **Add**.
5. Launch the app from the Home Screen and tap **Continue with Google** to sign in with your account (`aaronmathewg21@gmail.com` on Aaron's phone, `viniputhran17@gmail.com` on Vini's phone).

#### On Android (Chrome):
1. Open `https://couplequests-4faa5.web.app` in **Google Chrome**.
2. Tap the three-dot menu icon in the top right.
3. Tap **Install app** or **Add to Home screen**.
4. Launch the app from your app drawer/home screen and sign in with your designated Google account.

---

##  Project Structure

```
daily-sidequests-us-edition/
├── dist/                      # Production build output
├── public/                    # Static assets, PWA icons, manifest
│   ├── manifest.json
│   ├── sw.js                  # Service worker for offline & push notifications
│   └── icons/
├── src/
│   ├── App.tsx                # Main application component & UI controllers
│   ├── firebase.ts            # Firebase app, auth, and service initialization
│   ├── firestoreSync.ts       # Real-time Firestore sync & compression pipeline
│   ├── pushNotifications.ts   # Web Push / FCM registration logic
│   ├── soundEngine.ts         # Audio synthesis for app feedback & effects
│   ├── index.css              # Global styles & Tailwind v4 configuration
│   └── main.tsx               # React application entry point
├── firestore.rules            # Firestore security rules
├── storage.rules              # Firebase Storage security rules
├── firebase.json              # Firebase Hosting & emulator routing config
├── .firebaserc                # Active Firebase project identifier
├── package.json               # Node.js dependencies and run scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build & plugin configuration
└── README.md                  # Project documentation & reconstruction guide
```

---

##  Maintenance & Common Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Runs the local development server on `http://localhost:3000` |
| `npm run build` | Builds the production bundle in `dist/` |
| `npm run deploy:firebase` | Builds the bundle and deploys Firestore rules + Hosting |
| `npx firebase deploy --only hosting` | Deploys only the static frontend to Firebase Hosting |
| `npx firebase deploy --only firestore:rules` | Deploys updated Firestore database rules |
