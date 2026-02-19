# Google Cloud Setup Guide (Step-by-Step)

You need to create a **Project** and get a **Client ID** and **Client Secret**.

1.  **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a New Project**:
    - Click the project dropdown (top left).
    - Click **"New Project"**.
    - Name: `Pramanit Email`.
    - Click **Create**. Select the project once created.

3.  **Enable Gmail API**:
    - Search for **"Gmail API"** in the search bar.
    - Click **Enable**.

4.  **Configure OAuth Consent Screen**:
    - Go to **"APIs & Services" > "OAuth consent screen"**.
    - Choose **External**. Check **External** (Available to any user with a Google Account). Click **Create**.
        - *Note*: If you choose Internal, it only works for G-Suite users in your org. External is safer for `@gmail.com`.
    - **App Information**:
        - App name: `Pramanit Emailer`.
        - User support email: Select your email.
        - Developer contact email: Select your email.
    - Click **Save and Continue** (skip Scopes).
    - **Test Users**:
        - Click **Add Users**.
        - Enter **`pramanit.official@gmail.com`** (the email you will send FROM).
        - Click **Add**.
    - Click **Save and Continue**.

5.  **Create Credentials**:
    - Go to **"Credentials"** (left menu).
    - Click **"Create Credentials"** -> **"OAuth client ID"**.
    - **Application type**: **Web application**.
    - **Name**: `Pramanit Web Client`.
    - **Authorized redirect URIs**:
        - Click **Add URI** and enter: 
            - `https://developers.google.com/oauthplayground` (System Setup)
            - `http://localhost:5000/api/auth/google/callback` (Local Development)
            - `https://pramanit-j5wq.onrender.com/api/auth/google/callback` (Production)
            - *Note*: Ensure the backend URL matches exactly.
    - Click **Create**.

6.  **Copy Your Keys**:
    - **Client ID**: (e.g., `12345...apps.googleusercontent.com`)
    - **Client Secret**: (e.g., `GOCSPX-...`)

**PASTE THEM HERE:**
```
Client ID:
Client Secret:
```
Once you paste them, I will guide you to generate the special **Refresh Token**.
