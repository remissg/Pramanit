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
        - Enter your email (e.g., `maitijoydip888@gmail.com`).
        - **IMPORTANT**: Only these users can connect while the app status is "Testing".
    - Click **Save and Continue**.

### 5. Moving from "Testing" to "Production"
To allow **any** user to connect their Gmail without you manually adding them:
1.  Go to the **OAuth consent screen** page.
2.  Under **Publishing status**, click **"PUBLISH APP"**.
3.  Click **Confirm**.
4.  **Note**: Since we are using the `gmail.send` scope (Sensitive), Google might show a "This app isn't verified" warning until you complete a full security review. However, users can still click "Advanced" -> "Go to Pramanit (unsafe)" to connect.

6.  **Create Credentials**:
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

---

## Alternative: Custom SMTP (Outlook, Zoho, etc.)
If you prefer not to use Gmail OAuth or use another provider:

### 1. Outlook / Microsoft 365
- Go to [Security Basics](https://account.microsoft.com/security).
- Click **Advanced Security Options**.
- Turn on **2-Step Verification**.
- Click **"Create a new app password"**.
- Use these settings in Pramanit: 
    - **Host**: `smtp.office365.com`
    - **Port**: `587`
    - **User**: Your Email
    - **Pass**: The 16-character App Password.

### 2. Gmail (SMTP Method)
- Enable **2-Step Verification**.
- Search for **"App Passwords"** in your Google Account.
- Select "Custom" and name it "Pramanit".
- Use these settings in Pramanit:
    - **Host**: `smtp.gmail.com`
    - **Port**: `587`
    - **Pass**: The 16-character App Password.
