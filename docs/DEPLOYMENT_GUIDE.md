# 🚀 Deployment Guide

This guide will help you deploy **Pramanit** to production using **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Deployment (Render)

We will deploy the Node.js server first.

1.  **Push to GitHub**: Ensure your project is pushed to a GitHub repository (rename it to `pramanit` if possible).
2.  **Sign up for Render**: Go to [render.com](https://render.com) and log in with GitHub.
3.  **New Web Service**:
    -   Click "New +" -> "Web Service".
    -   Connect your `pramanit` (or `certiflow`) repo.
4.  **Configuration**:
    -   **Root Directory**: `server`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node index.js`
    -   **Environment Variables**: Copy these from your local `server/.env`:
        -   `MONGODB_URI`
        -   `JWT_SECRET`
        -   `CLOUDINARY_CLOUD_NAME`
        -   `CLOUDINARY_API_KEY`
        -   `CLOUDINARY_API_SECRET`
        -   `EMAIL_USER` / `EMAIL_PASS`
        -   `REDIS_URL` (If using Queues)
        -   `ENCRYPTION_KEY`
        -   `FRONTEND_URL`: **Important!** Set this to your future Vercel URL (e.g., `https://pramanit-app.vercel.app`) once you have it. For now, you can set it to `*` temporarily or update it later.
5.  **Deploy**: Click "Create Web Service".
6.  **Copy URL**: Once live, copy your backend URL (e.g., `https://pramanit-api.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Now we deploy the React client.

1.  **Sign up for Vercel**: Go to [vercel.com](https://vercel.com).
2.  **Add New Project**: Import your `pramanit` repo.
3.  **Configuration**:
    -   **Framework Preset**: Vite
    -   **Root Directory**: `client` (Click "Edit" next to Root Directory).
    -   **Environment Variables**:
        -   `VITE_API_BASE_URL`: Paste your **Render Backend URL** here (e.g., `https://pramanit-api.onrender.com`). **Note regarding `/api`**: Our code appends `/api` automatically in some places, so usually the base URL (without `/api`) is safer, or check your `axios` config.
        -   `VITE_CLOUDINARY_CLOUD_NAME`: Your cloud name.
4.  **Important Fix for React 19**:
    -   Ensure you have a `.npmrc` file in your `client` directory with `legacy-peer-deps=true`. We created this for you already.
5.  **Deploy**: Click "Deploy".

## 3. Final Checks

-   **CORS**: Go back to Render -> Environment Variables and update `FRONTEND_URL` to your actual Vercel domain (e.g., `https://pramanit-app.vercel.app`).
    -   Our server dynamically whitelists this URL.
-   **Test**: Sign up, create a template, and send a test email.

🎉 **Pramanit is Live!**
