# Firebase Deployment Guide 🚀

Yes, you can run this application on Firebase! 

Because this application is **full-stack** (it has a React frontend and a Node.js/Express API server that handles your Gemini API requests safely), a simple static upload to Firebase Hosting will cause API requests (`/api/*`) to fail. This is why the home or index page might load, but generation buttons do not work.

Here is the step-by-step guide to deploying both your frontend and your backend API to Firebase.

---

## Method 1: Firebase Hosting + Firebase Functions (Recommended for pure Firebase)

In this approach, Firebase Hosting serves your React frontend, and Firebase Functions hosts your Express API.

### 1. Initialize Firebase in your project
If you haven't already, install the Firebase CLI locally:
```bash
npm install -g firebase-tools
```

Then, log in and initialize Firebase inside your project folder:
```bash
firebase login
firebase init
```
During initialization, select:
1. **Hosting**: Configure files for Firebase Hosting.
2. **Functions**: Configure a Cloud Functions directory.
3. **Firestore**: (Optional) if you want to deploy Firestore security rules.

---

### 2. Configure Firebase Functions (Backend)
Move your Express API endpoints from `server.ts` into the `functions` folder.

1. Navigate to the `functions/` folder.
2. Install dependencies needed for your server:
   ```bash
   cd functions
   npm install express @google/genai dotenv cors
   ```
3. Update `functions/src/index.ts` (or `index.js`) to wrap your Express app as a Cloud Function:
   ```typescript
   import { onRequest } from "firebase-functions/v2/https";
   import express from "express";
   import cors from "cors";
   import { GoogleGenAI } from "@google/genai";

   const app = express();
   app.use(cors({ origin: true }));
   app.use(express.json());

   // Copy your API endpoints here (e.g., app.post("/api/generate-names", ...))
   app.post("/generate-names", async (req, res) => {
     // ... Your Gemini naming generator logic ...
   });

   // Export the Express app as a Firebase Cloud Function
   export const api = onRequest({ secrets: ["GEMINI_API_KEY"] }, app);
   ```

---

### 3. Configure Firebase Hosting & Rewrites (`firebase.json`)
To make sure your React frontend can call `/api/*` and load correctly, configure `firebase.json` in your root folder:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

---

### 4. Build and Deploy
1. Build your React frontend:
   ```bash
   npm run build
   ```
2. Set your Gemini API key secret in Firebase Functions:
   ```bash
   firebase functions:secrets:set GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
   ```
3. Deploy everything to Firebase:
   ```bash
   firebase deploy
   ```

---

## Method 2: Google Cloud Run (Easiest Full-Stack Option)

Since this app is already designed as a single packaged full-stack Node.js server (Vite + Express), deploying it as a container on **Google Cloud Run** is incredibly easy, cost-effective, and automatically manages the frontend and backend together under port `3000`.

This is exactly how Google AI Studio hosts and serves this applet!

1. Build the production package:
   ```bash
   npm run build
   ```
2. Deploy directly to Cloud Run using the gcloud CLI:
   ```bash
   gcloud run deploy brandforge --source . --env-vars-file .env
   ```

---

## Why did "index not work" previously?
1. **Dynamic Backend Missing**: If you only uploaded static files to standard static hosting, your browser was calling `/api/generate-names` on your static host, which returned a `404 Not Found` or redirected back to `index.html`.
2. **Missing Environment Variables**: When deployed to a new platform, the platform does not automatically have your `GEMINI_API_KEY`. You must add `GEMINI_API_KEY` to your deployment platform's Environment Variables panel.
