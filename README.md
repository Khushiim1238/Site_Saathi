# BuildTrack CRM — Construction Site Lead Capture & Conversion System

A tailored operational platform built to solve the WhatsApp communication bottlenecks and lack of conversion visibility in construction material supply and contracting businesses.

---

## 🎯 The Problem Solved

| Old WhatsApp Process | Loopholes & Problems | BuildTrack Solution |
| :--- | :--- | :--- |
| **Field agents send numbers in chat** | Numbers get buried, typos occur, agents submit duplicate leads for the same site. | **Mobile PWA Lead Capture**: Live duplicate phone detection, automatic GPS coordinate tagging, visiting card photo upload. |
| **No lead ownership** | Two callers call the same site, or leads are ignored because everyone assumes someone else called. | **Central Unclaimed Pool**: Fair 1-click lead claiming. Once claimed, the lead is locked to that telecaller. |
| **Unrecorded calls & notes** | Call discussions, material requirements, and prices quoted are lost in thin air. | **Click-to-Call & Structured Logging**: 1-tap dial (`tel:`), status tagging (Interested, Quote Sent, Callback Scheduled), notes, and duration. |
| **Blind Manager Oversight** | Manager cannot see if leads convert, which caller is performing, or why deals are lost. | **Real-Time Executive Dashboard**: Full conversion funnel, agent visit tracking, caller productivity, overdue callback alerts, and CSV export. |

---

## 🚀 Quick Start

### 1. Start the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 Role Perspectives & Demo Accounts

Use the **Perspective Switcher** dropdown in the top-right navbar to test any role instantly:

1. **👔 Mr. Sharma (Director / Manager)**
   - Role: `MANAGER`
   - Access: `/admin` (Conversion Funnel, Leaderboards, Activity Stream, Overdue Alerts)
2. **👷 Vikram Singh (Field Agent)**
   - Role: `FIELD_AGENT`
   - Access: `/agent` (On-site mobile capture with GPS, duplicate phone check, past submissions)
3. **👷 Amit Kumar (Field Agent)**
   - Role: `FIELD_AGENT`
   - Access: `/agent`
4. **📞 Pooja Verma (Telecaller)**
   - Role: `CALLER`
   - Access: `/caller` (Unclaimed pool, 1-click lead claiming, click-to-call, callback reminders)
5. **📞 Rohan Mehra (Telecaller)**
   - Role: `CALLER`
   - Access: `/caller`

---

## 📋 End-to-End Walkthrough (2-Minute Test)

### Step 1: Capture a Site on Field Agent View (`/agent`)
1. Switch to **Vikram Singh (Field Agent)** in the top bar.
2. Enter Project Name (e.g. *Sapphire Heights Tower 1*).
3. Type a 10-digit phone number: notice the **instant duplicate detection** checking the database in real time.
4. Click **"Auto-Tag GPS"** to attach live coordinates.
5. Select materials needed (e.g., *TMT Steel*, *Cement Grade 53*).
6. Click **"Save & Push Lead to Calling Pool"**.

### Step 2: Claim & Call on Calling Desk (`/caller`)
1. Switch to **Pooja Verma (Telecaller)**.
2. Go to **Unclaimed Pool** tab: see the newly logged site lead.
3. Click **"Claim Lead"** $\rightarrow$ Lead moves into *My Claimed Leads*.
4. Click **"Call Now"** (dials customer and opens the call disposition modal).
5. Select outcome: **"Callback Scheduled"** (pick tomorrow's time) or **"Deal Won 🎉"**.
6. Enter discussion notes and click **"Save Call Outcome"**.

### Step 3: Monitor Conversions on Manager Dashboard (`/admin`)
1. Switch to **Mr. Sharma (Manager)**.
2. View the **Live Conversion Funnel**:
   $$\text{Site Visits} \longrightarrow \text{Claimed} \longrightarrow \text{Interested} \longrightarrow \text{Quote Sent} \longrightarrow \text{Won}$$
3. Check the **Field Agent Leaderboard** (shows who visited the site).
4. Check **Telecaller Productivity** (calls logged and deals closed).
5. Monitor **Pending/Overdue Callbacks** so no customer is forgotten.
6. Visit **`/leads`** to filter all records or click **"Download CSV Report"**.

---

## 🛠️ Technology Architecture

- **Frontend & Server**: [Next.js 16](https://nextjs.org/) App Router, React 19, TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: Native `node:sqlite` (SQLite 3.51 with WAL mode) — fast, zero-dependency, local file storage in `data/crm.sqlite`.
- **Export**: Built-in CSV report generator for Excel/Google Sheets.
