# Certificate Correction System - Complete Workflow Guide

## 🎯 Overview

This guide explains how the certificate correction system works and how to integrate it into your application.

## 📧 How the Contact Button Works

### 1. Email Template
When a certificate is sent, the email includes a "Contact Certificate Issuer" button that links to:
```
https://your-domain.com/contact-issuer?cert=CERTIFICATE_ID
```

### 2. Contact Form Page
The contact form is served at `/contact-issuer` and:
- Auto-fills the certificate ID from URL
- Allows recipient to select request type (name correction, email change, etc.)
- Sends data to `POST /api/contact/contact-issuer`
- Creates a contact message in the database

### 3. Notification Flow
```
Recipient Clicks Button
    ↓
Opens Contact Form
    ↓
Fills & Submits Request
    ↓
Backend Creates ContactMessage
    ↓
Sends Email Notification to Issuer
    ↓
Issuer Sees Request in Dashboard
```

## 🔧 API Endpoints for Issuer Dashboard

### 1. Get All Correction Requests
```http
GET /api/corrections/requests
Authorization: Bearer <token>
```

**Response:**
```json
{
  "corrections": [
    {
      "cert_id": "abc123",
      "recipient_name": "John Doe",
      "recipient_email": "john@example.com",
      "correction_status": "pending",
      "requested_name": "Jonathan Doe",
      "contact_message": {
        "subject": "Name Correction Request",
        "message": "Please correct my name...",
        "message_type": "name_correction"
      }
    }
  ],
  "pagination": {
    "current": 1,
    "total": 5,
    "count": 50
  }
}
```

### 2. Get Correction Statistics
```http
GET /api/corrections/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pending": 10,
  "approved": 25,
  "rejected": 5,
  "total": 40
}
```

### 3. Process Correction (Approve/Reject)
```http
POST /api/corrections/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "certificate_id": "abc123",
  "action": "approve",
  "corrected_data": {
    "name": "Jonathan Doe",
    "email": "jonathan@example.com"
  }
}
```

**Response (when approved):**
```json
{
  "message": "Correction approved and new certificate created",
  "action": "approved",
  "new_certificate": {
    "cert_id": "xyz789",
    "recipient_name": "Jonathan Doe"
  },
  "old_certificate": {
    "cert_id": "abc123",
    "status": "revoked"
  }
}
```

## 🔄 Correction Workflow: New vs Modified Certificate

### **Recommended Approach: Create NEW Certificate**

When a correction is approved, the system:
1. ✅ **Creates a NEW certificate** with a new Certificate ID
2. ✅ **Marks old certificate as "revoked"** (maintains audit trail)
3. ✅ **Sends new certificate** to recipient with new ID
4. ✅ **Preserves history** of all certificates issued

### **Why Create a New Certificate?**

✅ **Integrity**: Original certificate remains unchanged
✅ **Audit Trail**: Complete history of all versions
✅ **Verification**: Old cert shows "corrected/superseded" status
✅ **Security**: Prevents tampering with issued certificates
✅ **Compliance**: Meets standards for digital credentials

### **Certificate Lifecycle:**

```
Original Certificate (abc123)
    ↓
Correction Requested
    ↓
Issuer Approves
    ↓
New Certificate Created (xyz789) ← Active
Old Certificate Marked Revoked ← Inactive
    ↓
Recipient Gets New Certificate
```

## 🎨 Frontend Integration Examples

### 1. Issuer Dashboard - Corrections Tab

```jsx
// CorrectionsDashboard.jsx
import React, { useEffect, useState } from 'react';

const CorrectionsDashboard = () => {
  const [corrections, setCorrections] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Fetch correction requests
    fetch('/api/corrections/requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setCorrections(data.corrections));

    // Fetch stats
    fetch('/api/corrections/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setStats(data));
  }, []);

  const handleApprove = async (certId, correctedName) => {
    const response = await fetch('/api/corrections/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        certificate_id: certId,
        action: 'approve',
        corrected_data: { name: correctedName }
      })
    });
    
    const result = await response.json();
    // Show success message with new certificate ID
    alert(`New certificate created: ${result.new_certificate.cert_id}`);
  };

  const handleReject = async (certId) => {
    await fetch('/api/corrections/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        certificate_id: certId,
        action: 'reject'
      })
    });
    
    // Refresh list
    // ...
  };

  return (
    <div>
      <h2>Certificate Correction Requests</h2>
      
      {/* Stats */}
      <div className="stats">
        <div>Pending: {stats.pending}</div>
        <div>Approved: {stats.approved}</div>
        <div>Rejected: {stats.rejected}</div>
      </div>

      {/* Correction List */}
      {corrections.map(correction => (
        <div key={correction.cert_id} className="correction-card">
          <h3>Certificate: {correction.cert_id}</h3>
          <p>Current Name: {correction.recipient_name}</p>
          <p>Requested Name: {correction.requested_name}</p>
          <p>Status: {correction.correction_status}</p>
          
          {correction.contact_message && (
            <div className="message">
              <p><strong>Message:</strong> {correction.contact_message.message}</p>
            </div>
          )}
          
          {correction.correction_status === 'pending' && (
            <div className="actions">
              <button onClick={() => handleApprove(correction.cert_id, correction.requested_name)}>
                Approve & Create New Certificate
              </button>
              <button onClick={() => handleReject(correction.cert_id)}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CorrectionsDashboard;
```

### 2. Contact Form (Already Created)

The contact form is at `public/contact-issuer.html` and is served at:
```
/contact-issuer?cert=CERTIFICATE_ID
```

## 🗄️ Database Schema

### ContactMessage Collection
```javascript
{
  recipient_email: "encrypted",
  recipient_name: "John Doe",
  certificate_id: "abc123",
  issuer: ObjectId("..."),
  subject: "Name Correction Request",
  message: "Please correct my name...",
  message_type: "name_correction", // name_correction, email_change, certificate_issue, general_inquiry
  status: "pending", // pending, read, responded, resolved
  issuer_response: "",
  created_at: Date,
  updated_at: Date
}
```

### Verification Collection (with corrections)
```javascript
{
  cert_id: "abc123",
  recipient_name: "John Doe",
  correction_requested: true,
  requested_name: "Jonathan Doe",
  correction_status: "pending", // none, pending, approved, rejected
  status: "active", // active, revoked (after correction approved)
  // ... other fields
}
```

## 📊 Workflow Summary

### For Recipients:
1. Receive certificate email with "Contact Issuer" button
2. Click button → Open contact form
3. Fill request type and details
4. Submit → Message sent to issuer
5. Wait for issuer response
6. If approved: Receive new certificate with new ID

### For Issuers:
1. Receive email notification of correction request
2. Log in to dashboard
3. View all correction requests in "Corrections" tab
4. Review request details and message
5. **Approve**: Creates new certificate, sends to recipient, marks old as revoked
6. **Reject**: Notifies recipient, request closed

## 🚀 Implementation Checklist

- [x] Contact button in email template
- [x] Contact form page (`/contact-issuer`)
- [x] Backend API for contact messages
- [x] Certificate correction controller
- [x] Correction workflow (new certificate approach)
- [ ] Frontend dashboard integration (Issuer Corrections tab)
- [ ] Email notifications for all steps
- [ ] Test complete workflow end-to-end

## 🎯 Key Benefits

✅ **Clear audit trail** - All versions preserved
✅ **No data loss** - Original certificate still exists
✅ **Recipient trust** - New certificate proves correction
✅ **Compliance** - Meets credential standards
✅ **Easy integration** - Ready-to-use API endpoints
