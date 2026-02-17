# 🚀 Deployment Guide

This guide will help you deploy CertiFlow to production using **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Deployment (Render)

We will deploy the Node.js server first.

1.  **Push to GitHub**: Ensure your project is pushed to a GitHub repository.
2.  **Sign up for Render**: Go to [render.com](https://render.com) and log in with GitHub.
3.  **New Web Service**:
    -   Click "New +" -> "Web Service".
    -   Connect your `certiflow` repo.
4.  **Configuration**:
    -   **Root Directory**: `server`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node index.js`
    -   **Environment Variables**: Copy these from your local `server/.env`:
        -   `MONGODB_URI`
        -   `JWT_SECRET`
        -   `CLOUDINARY_...` (All 3)
        -   `EMAIL_USER` / `EMAIL_PASS`
        -   `REDIS_URL` (If using Queues)
        -   `ENCRYPTION_KEY`
5.  **Deploy**: Click "Create Web Service".
6.  **Copy URL**: Once live, copy your backend URL (e.g., `https://certiflow-api.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Now we deploy the React client.

1.  **Sign up for Vercel**: Go to [vercel.com](https://vercel.com).
2.  **Add New Project**: Import your `certiflow` repo.
3.  **Configuration**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: `client` (Click "Edit" next to Root Directory).
    -   **Environment Variables**:
        -   `VITE_API_BASE_URL`: Paste your **Render Backend URL** here (e.g., `https://certiflow-api.onrender.com/api`).
        -   `VITE_CLOUDINARY_CLOUD_NAME`: Your cloud name.
4.  **Deploy**: Click "Deploy".

## 3. Final Checks

-   **CORS**: If you get CORS errors, go to `server/index.js` and update the `cors` origin to include your new Vercel domain.
    ```javascript
    app.use(cors({
        origin: ["http://localhost:5173", "https://your-vercel-app.vercel.app"],
        credentials: true
    }));
    ```
-   **Test**: Sign up, create a template, and send a test email.

🎉 **CertiFlow is Live!**
