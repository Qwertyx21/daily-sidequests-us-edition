# Daily SideQuests: Us Edition

Built with **React 19**, **Tailwind CSS v4**, Firebase Authentication, **Cloud Firestore** realtime sync, Firebase Storage, and Cloud Functions.

## How to Host & Install on Both Phones (Aaron's Phone + Vini's Phone)

Open [the Firebase app](https://couplequests-4faa5.web.app) and sign in with the authorized Google account for that device. The Firebase deployment procedure below publishes updates.

## Deploy the frontend to Firebase Hosting

The Firebase Hosting project is already selected in `.firebaserc` (`couplequests-4faa5`). From the project folder run:

```powershell
npm install
npm run build
npx firebase deploy --only hosting --project couplequests-4faa5
```

This publishes the static app to `https://couplequests-4faa5.web.app`.

## Firestore, storage, and Cloud Functions

Cloud Firestore is the source of truth for live chat, per-partner challenges, profile settings, and Photo Vault records. Firestore listeners synchronize updates in real time, and its browser cache queues supported writes while a device is offline. Challenge records are readable only by the assigned account; chat and shared photos are readable by both authorized accounts. Completion totals are read-only and increment through a Cloud Function when a challenge changes to completed.

The application also stores uploaded images in Firebase Storage. In Firebase Console, confirm that Cloud Firestore and Firebase Storage are enabled for `couplequests-4faa5`. Cloud Functions deployment may require the project to use the Blaze billing plan; review pricing and set budget alerts before enabling billing.

Install the Functions dependencies and deploy database/storage rules and functions:

```powershell
Set-Location 'C:\path\to\daily-sidequests-us-edition'
npm install
npm --prefix functions install
npm run build
npx firebase deploy --only firestore:rules,storage,functions --project couplequests-4faa5
```

Deploy Hosting after the services:

```powershell
npx firebase deploy --only hosting --project couplequests-4faa5
```

The rules are in `firestore.rules` and `storage.rules`. Do not replace them with broad authenticated-user access rules.

### Browser notifications

Live foreground chat and challenge updates use Firestore listeners. Closed-app challenge notifications use Firebase Cloud Messaging, whose Cloud Function runs when a challenge is assigned.

In Firebase Console, go to **Project settings → Cloud Messaging → Web configuration → Web Push certificates** and generate a key pair. Copy the **public key only** into a local `.env` file as `VITE_FIREBASE_VAPID_KEY=...`; never put a private key in frontend code. Then rebuild and redeploy Hosting:

```powershell
npm run build
npx firebase deploy --only hosting --project couplequests-4faa5
```

The `.env.example` file lists variable names only. Each phone must allow notifications in its normal (non-private) browser session. Install the PWA on iPhone before expecting background notifications.

### Moving existing local data

On the first sign-in after the new version is deployed, the app attempts a one-time migration of that device's cached challenges, chat, profiles, and photos into Firestore. Keep each device online and signed into its own Google account during its first launch. Check both phones afterward to confirm their own challenges and the shared chat/photo history are present.
