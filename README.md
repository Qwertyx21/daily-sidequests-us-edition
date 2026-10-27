# Daily SideQuests: Us Edition

Built with **React 19**, **Tailwind CSS v4**, **Lucide Icons**, **Express**, authenticated **WebSockets**, Firebase Google sign-in, and Web Push.

## How to Host & Install on Both Phones (Aaron's Phone + Vini's Phone)

### Option A: Free Cloud Hosting on Render.com or Railway (Works Anywhere over 5G / Wi-Fi)
1. Push this folder to a private GitHub repository.
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app) connected to your repo:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Configure the environment variables described below in the host's service settings. The server verifies Firebase ID tokens for project `couplequests-4faa5` and permits only the configured Aaron and Vini Google accounts.
4. Open the same service URL on both devices and sign in with the appropriate Google account. The signed-in account selects and locks the partner side; URL parameters cannot switch sides.
5. **Install as a Real Full-Screen Phone App (PWA)**:
   - **iPhone (Safari)**: Tap **Share** → **Add to Home Screen**.
   - **Android (Chrome)**: Tap the **⋮ Menu** → **Install App / Add to Home Screen**.

### Option B: Run Locally on Your Laptop & Connect Both Phones Instantly
```bash
npm install
npm run build
npm start
```
Then open `http://<your-laptop-ip>:3000` on both devices and sign in with the appropriate Google account. Push notifications require HTTPS, except for localhost.

## Background notifications

The server sends Web Push alerts for newly assigned challenges, including while the recipient's browser/PWA is closed. Push requires a secure HTTPS deployment, a browser that supports Web Push, and notification permission granted separately on each device.

Generate a VAPID key pair once with `npx web-push generate-vapid-keys`. In the hosting provider's environment settings, configure:

- `VAPID_PUBLIC_KEY`: generated public key.
- `VAPID_PRIVATE_KEY`: generated private key. Keep it secret; never commit it.
- `VAPID_SUBJECT`: contact URI such as `mailto:you@example.com`.

`.env.example` lists the variable names only. It is not loaded automatically; configure variables in your hosting provider or shell environment before starting the server. If VAPID keys are absent, sign-in and live sync still work, but the app reports that background push is not configured.

The server persists room state and device subscriptions in its `data` directory. Use a persistent disk/volume on Render, Railway, or your host so these files survive deployments and restarts.

## Deploy the frontend to Firebase Hosting

The Firebase Hosting project is already selected in `.firebaserc` (`couplequests-4faa5`). From the project folder run:

```powershell
npm install
npm run build
npx firebase deploy --only hosting --project couplequests-4faa5
```

This publishes the static app to `https://couplequests-4faa5.web.app`. Firebase Hosting does not run `server.ts`; deploy the Express/WebSocket server separately as a Node web service (for example, on Render or Railway) with the build command `npm install && npm run build` and start command `npm start`. Configure `APP_ORIGIN=https://couplequests-4faa5.web.app` on that service, along with VAPID values if using push notifications.

After both deployments are live, sign in on the Firebase site, open **Live Sync Settings**, and set **Live Server URL** to the backend's HTTPS service URL (for example, `https://your-service.onrender.com`) on each device. This is required for authenticated live sync and challenge delivery. Firebase Hosting alone only serves the app shell; it cannot provide this server-side behavior.

Use persistent storage for the backend's `data` directory. Without it, room data and saved push subscriptions may be lost when the service restarts or redeploys.
