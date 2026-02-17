# Developer API & Custom Certificates Guide

This guide explains how external systems (like an LMS, website, or script) can automatically issue certificates using Pramanit's API, and how custom templates work in this process.

## 1. How Custom Templates Work via API

The core concept is **"Static Design + Dynamic Data"**.

*   **Presaved (Static):** The layout, background image, fonts, colors, and fixed text (e.g., "Certificate of Completion"). You save this **once** in the Designer.
*   **API Sent (Dynamic):** The specific details for each student (e.g., Name, Date, Course Title). You send this **every time** you trigger the API.

You don't send the design layout in the API request; you send the `design_id` of a template you've already saved.

### The Full Workflow:

#### Step 1: Create & Save Design (GUI)
1.  Go to the **Certificate Generator** in the Pramanit app.
2.  Upload your base certificate image.
3.  Drag and drop fields (Name, Date, Course, etc.) to position them.
    *   *Tip:* Use generic text like `{{name}}` or just "Name" as placeholders.
4.  **Important:** Click the **"Save Design"** button in the customized toolbar (top right of the preview area).
    *   *Note:* You must be logged in to see this button.
5.  Give your design a name (e.g., "Standard Bootcamp Cert") and save.

#### Step 2: Get the Design ID
1.  Go to **Dashboard > Designs**.
2.  Find your saved design in the list.
3.  The ID is usually visible or can be retrieved via the API endpoint below.

#### Step 3: Trigger API (The "Magic" Part)
This is where you tell Pramanit *who* the certificate is for. You match your **Design Placeholders** to the **API JSON**.

**Example:**
If your design has:
*   `{{name}}`
*   `{{course_name}}`
*   `{{completion_date}}`

Your API Request **body** must look like this:
```json
{
  "design_id": "65d8f9...",
  "recipient": {
    "name": "Jane Doe",            // Maps to {{name}}
    "email": "jane@example.com",   // Required for sending email
    "course_name": "React Pro",    // Maps to {{course_name}}
    "completion_date": "2026-05-20"// Maps to {{completion_date}}
  }
}
```

**Key Rule:** The keys in the `recipient` JSON must exactly match the text inside your handlebars `{{...}}` in the design (minus the brackets).

#### Step 4: Generation
Pramanit's server takes the design, finds `{{course_name}}`, and replaces it with `"React Pro"` from your request. It does this for all fields, generates the PDF, and emails it to `jane@example.com`.

---

## 2. API Authentication

All requests must be authenticated using your **API Key**.

*   **Header:** `x-api-key: YOUR_SECRET_KEY`
*   **Where to find it:** Go to **Dashboard > Developer Tab** (Admin Only).

---

## 3. API Endpoints

### A. Issue a Single Certificate
**Endpoint:** `POST /api/external/issue`

**Body (JSON):**
```json
{
  "design_id": "65d8f9...", // (Optional) ID of the saved design. If omitted, uses a default layout.
  "recipient": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "course": "Advanced React Patterns", // Custom field matching your template
    "date": "2026-05-20"
  },
  "email_template_id": "email_123..." // (Optional) ID of a saved email template
}
```

**Response:**
```json
{
  "success": true,
  "certificate_url": "https://...",
  "message": "Certificate issued and emailed to jane@example.com"
}
```

---

### B. Get All Designs (to find IDs)
**Endpoint:** `GET /api/external/designs`

**Response:**
```json
{
  "success": true,
  "designs": [
  {
    "id": "65d8f9...",
    "name": "Python Course 2026",
    "preview_url": "..."
  },
  {
    "id": "65d8fa...",
    "name": "Web Dev Bootcamp",
    "preview_url": "..."
  }
  ]
}
```

---

## 4. Webhooks (Real-time Notifications)

You can configure a Webhook URL in the **Developer Tab**. Pramanit will send a POST request to this URL whenever a certificate is issued.

**Payload Sent to Your Webhook:**
```json
{
  "event": "certificate.issued",
  "data": {
    "recipient_email": "jane@example.com",
    "recipient_name": "Jane Doe",
    "certificate_url": "https://...",
    "issued_at": "2026-05-20T10:00:00Z"
  }
}
```

---

## 5. Typical Use Case: Institute Automation

1.  **Design Phase:** The Institute Admin logs into Pramanit and designs the "Annual Award" certificate. They added a text box for `{{student_name}}` and `{{award_title}}`. They save this design.
2.  **Integration:** The Institute's IT team copies the `API Key` and the `design_id`.
3.  **Automation:** The Institute has a student portal. When a student completes a course, the portal automatically triggers the `process_certificate` script.
4.  **Issuance:** The script calls Pramanit's API with the student's details.
5.  **Delivery:** The student receives an email with their personalized "Annual Award" certificate instantly.
