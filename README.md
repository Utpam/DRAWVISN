# DRAWVISN
A Virtual WhiteBoard Software to convey your Ideas on screen !

## Deploy

The frontend is a static Vite app and the realtime collaboration server is a
separate Node.js service. Deploy the frontend to Vercel and the server to
Render.

### Render (realtime server)

1. Create a Render Blueprint from this repository and deploy `render.yaml`.
   The Blueprint uses `server` as its root directory and configures the `/health`
   health check.
2. Set `FIREBASE_PROJECT_ID` to your Firebase project ID.
3. Set `CLIENT_URL` to the deployed Vercel origin (for example,
   `https://your-app.vercel.app`). Separate multiple allowed origins with
   commas if needed.
4. After deployment, copy the server URL, such as
   `https://drawvisn-server.onrender.com`.

### Vercel (frontend)

1. Import this repository into Vercel and set the project **Root Directory** to
   `frontend`. The included `vercel.json` builds the Vite app and routes
   client-side paths to `index.html`.
2. Add the following environment variables in the Vercel project settings:
   - `VITE_SOCKET_URL`: the Render server URL from the previous section
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Redeploy after setting or changing environment variables.

Update Render's `CLIENT_URL` to the Vercel deployment origin, then redeploy the
Render service. Keep Firebase web configuration in Vercel's `VITE_FIREBASE_*`
variables and the server's `FIREBASE_PROJECT_ID` set to the same Firebase
project.
