# Recall

A minimal, mobile-first spaced revision tracker built with React and TypeScript, designed primarily for Android phones.

## Core Purpose & Revision Schedule
Recall is built for studying and retention. When you are learning a task or solving a problem, add it to Recall. It starts in the **Learning** stage without any schedule. When you are done learning it, click **“Mark as learned”**.

- **Day 0:** The date you click “Mark as learned”.
- **1st revision:** Day 1 (`Day 0 + 1 day`)
- **2nd revision:** Day 3 (`Day 0 + 3 days`)
- **3rd revision:** Day 7 (`Day 0 + 7 days`)

### Revision Rules
- **No levels:** Revisions are strictly labeled **“1st revision”**, **“2nd revision”**, and **“3rd revision”**.
- **Remembered:** Moves to the next scheduled revision. After the 3rd revision is remembered, the task is marked **Finished** and no further revisions are scheduled.
- **Forgotten:** Schedules another attempt for the next day while keeping the same revision number until you remember it. No revisions are skipped.
- **Overdue handling:** Missed revisions stay overdue until completed. They are never skipped automatically.
- **Restarting:** Finished tasks can be restarted back to the Learning stage at any time.

---

---

## App Screens & Navigation

### 1. Today (Main Dashboard)
- **Header:** Displays today's local date, PWA install button, and JSON backup manager.
- **Add task:** Quick input with autofocus to add tasks (e.g. `lcs tut 3 q1`).
- **Due and overdue:** Lists all revisions due today and overdue items, sorted with overdue items first. Clearly highlights overdue duration and provides **Remembered** and **Forgotten** action buttons.
- **Learning:** Tasks currently being studied with a clear **Mark as learned** button.
- **Finished:** Tasks where all three revisions are complete. Allows restarting or deleting.

### 2. Last 7 Days (Timeline & Archive Page)
- Accessible via the bottom navigation bar.
- Shows all tasks created, learned, or revised in the past 7 days.
- **Next revision due box:** Clearly states which revision is due next (e.g. `Next Due: 1st revision • Due tomorrow`, `Next Due: 2nd revision • Overdue by 1 day`, `Finished • All 3 revisions completed`).
- **Archive feature:** Includes an **Archive** / **Unarchive** button on every task. Archived tasks can be filtered under the "Archived" tab, keeping your daily due list clean.
- Filter tabs: `All`, `Revising`, `Learning`, `Finished`, and `Archived`.
- 7-day stats overview with counts for each status.

---

## Quick Start & Running Locally

### 1. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To access it on your Android phone over your local Wi-Fi, open the Network URL displayed in the terminal (e.g., `http://<your-lan-ip>:5173/`).

### 2. Run Tests
Recall includes a test suite covering task creation, marking as learned, all 3 revision dates, forgotten attempts, overdue sorting, task completion, and backup validation:
```bash
npm test
```

### 3. Build for Production
```bash
npm run build
```

---

## Deployment to Free HTTPS Hosts

Recall is pre-configured for free static hosting with zero setup required. HTTPS is required by Android Chrome to enable PWA installation and service worker offline caching.

### Option A: Deploy to Vercel (Recommended - 1 Click)
1. Push this repository to GitHub or install the Vercel CLI (`npx vercel`).
2. Import the repository in [Vercel](https://vercel.com).
3. The included [`vercel.json`](file:///c:/Users/Amitabh/Desktop/recall/vercel.json) automatically configures the Vite build, SPA routing, and service worker headers.
4. Click **Deploy**. Your app will be live on `https://your-app.vercel.app`.

### Option B: Deploy to Netlify
1. Connect your repository in [Netlify](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. The included [`netlify.toml`](file:///c:/Users/Amitabh/Desktop/recall/netlify.toml) and [`public/_redirects`](file:///c:/Users/Amitabh/Desktop/recall/public/_redirects) automatically handle SPA routing and PWA headers.

### Option C: Deploy to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages**.
2. Connect your Git repository.
3. Framework preset: **Vite** (Build command: `npm run build`, Output directory: `dist`).
4. Click **Save and Deploy**.

---

## How to Install and Use Offline on Android

1. Open your deployed HTTPS URL (or local network URL) in **Google Chrome** on your Android phone.
2. Tap the **Install** button in the top header, or open Chrome's menu (**⋮**) in the top right corner and tap **Install app** (or **Add to Home screen**).
3. Recall will install on your phone's home screen and app drawer as an independent, fullscreen app (WebAPK).
4. **Offline Use:**
   - On your first visit, the service worker immediately precaches the complete app shell (HTML, CSS, JS bundle, manifest, and icons).
   - Once installed, you can disconnect Wi-Fi or turn on Airplane Mode: Recall will open instantly and operate 100% offline.
   - You can add tasks, mark them as learned, mark revisions as Remembered or Forgotten, and view the Last 7 Days timeline while completely offline.
   - All tasks are saved synchronously to device storage and are never lost when the app updates or connection drops.

---

## Backup & Restore
Click the database/backup icon in the header:
- **Export backup (JSON):** Downloads all tasks and revision history as a `.json` file.
- **Import backup (JSON):** Restores tasks and schedules with schema validation and duplicate ID protection.
