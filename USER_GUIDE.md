# Warm Lead - User Guide

## 🔐 Getting Started

### 1. Account Access
The application now uses real authentication.

*   **Login**: Go to `/login`
*   **Sign up**: Go to `/signup`
*   **Admin Access**:
    *   Email: `admin@admin.com`
    *   Password: `admin`
    *   *Note: This account is auto-created the first time you log in with these credentials.*

### 2. Dashboard Overview
Once logged in, you can:
- Start warming pixels with **Random Data**.
- Upload **Excel Sheets** for targeted warming.
- View real-time results and success rates.

---

## 🛡️ Admin Dashboard (`/admin`)

The Admin Panel is for site administrators to manage the platform.

### User Management
- View a list of all registered users.
- See how many campaigns each user has run.
- **Manage Users**: Edit or delete users as needed.

### Global Statistics
- View total users on the platform.
- View total campaigns across all users.

---

## 📊 Pixel Warming Campaigns

### Method 1: Automatic Excel Detection (NEW)
This is the fastest way to run campaigns.

1.  Prepare your Excel file (first row should be headers).
2.  Select **"Excel Upload"** mode.
3.  Drag and drop your file.
4.  **Automatic Matching**: The app will automatically detect your columns (Name, Phone, City, Price).
    - It supports French (Nom, Téléphone), English (Name, Phone), and many variations.
5.  **Confidence Check**: Look for the blue confirmation box. If you see "✓ High Confidence", the mapping is correct and auto-applied.
6.  Click **"Start Pixel Warming"**.

### Method 2: Random Data
Useful for quickly warming a pixel without your own database.

1.  Select **"Random Data"** mode.
2.  Enter the **Landing Page URL**.
3.  Choose the **Number of Orders** (e.g., 50).
4.  Click **"Start Pixel Warming"**.
5.  The app will generate realistic Algerian names, phones, and locations to fire pixel events.

---

## 📑 Supported Excel Formats

The app intelligently detects your columns. For best results, name your headers like this:

| Field | Supported Header Names |
| :--- | :--- |
| **Name** | Name, Nom, Cliente, Customer, Fullname, Prenom |
| **Phone** | Phone, Telephone, Tel, Mobile, GSM, Contact |
| **City** | City, Ville, Address, Wilaya, Location |
| **Price** | Price, Prix, Amount, Montant, Total, Value |

---

## 🛠️ Performance & Best Practices

1.  **Pacing**: The app waits 2-3 seconds between orders to appear natural.
2.  **Browser**: The app uses a headless browser on your server to visit the URL and fire the `Purchase` event via JavaScript (`fbq`, `ttq`, `gtag`).
3.  **Verification**: 
    - Check your Facebook Events Manager (Test Events tab) to see events appearing in real-time.
    - Check TikTok Events Manager for "CompletePayment" events.

## ❓ Troubleshooting

### Connection Errors
If the app can't reach your site, check:
- Is your URL correct? (Must include `https://`)
- Does your site have bot protection (like Cloudflare) that blocks automated visits?

### Low Success Rate
- Ensure your Pixel is correctly installed and active on the landing page.
- Make sure the page loads quickly (within 5-10 seconds).

---
*© 2026 Hashtag Automation - Production Version 1.1*
