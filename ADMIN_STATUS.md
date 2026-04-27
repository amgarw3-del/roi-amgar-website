# סטטוס לוח מנהל — אתר הרב רועי אמגר

## עדכון אחרון: 2026-04-26

---

## מה הושלם ✅

### Phase 1 — ליבה
- **Auth:** Google OAuth ידני — `api/admin/google-auth` + `api/admin/google-callback`
- **Layout:** sidebar עברי RTL, מובייל, `SiteShell` מבודד מהאתר הציבורי
- **Dashboard:** KPIs + פעולות מהירות
- **סרטונים:** ניהול מלא + שדה `hidden` (הסתרה ללא עצירת סנכרון)
- **דברי תורה:** CRUD + AI summarize (Claude Sonnet + prompt caching)
- **שאל את הרב:** תור שאלות + עורך תשובה + toggle פרסום
- **קטגוריות:** צפייה + מונה פריטים

### Phase 2 — שיווק והפצה
- **ניוזלטר:** `/admin/newsletter` — רשימת מנויים + עורך + שליחה דרך Gmail
- **שיתוף חברתי:** כפתור Share2 בכל דבר תורה מפורסם → modal עם גרסאות וואטסאפ + אינסטגרם (Claude Haiku)
- **מאמרים:** `/admin/content/blog` — CRUD לפוסטים
- **Vercel Analytics:** `@vercel/analytics` מותקן + `<Analytics />` ב-layout.tsx

---

## ENV vars שצריך להוסיף ב-Vercel

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAILS=amgarw3@gmail.com
```

## הגדרת Google OAuth (חד-פעמי)
1. https://console.cloud.google.com/ → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web Application)
3. Authorized redirect URIs:
   - `https://website-seven-kappa-25.vercel.app/api/admin/google-callback`
   - `http://localhost:3000/api/admin/google-callback`

---

## ניווט Sidebar (סדר)
1. דשבורד
2. סרטונים (`/admin/content/videos`)
3. דברי תורה (`/admin/content/divrei-tora`)
4. מאמרים (`/admin/content/blog`)
5. שאל את הרב (`/admin/content/qna`)
6. קטגוריות (`/admin/content/categories`)
7. ניוזלטר (`/admin/newsletter`)

---

## API Routes
```
/api/admin/google-auth         ← redirect לGoogle
/api/admin/google-callback     ← קבלת callback מGoogle
/api/admin/auth                ← (ישן, לא בשימוש)
/api/admin/session             ← בדיקת session
/api/admin/logout              ← התנתקות
/api/admin/toggle-hidden       ← הסתרת/הצגת סרטון
/api/admin/summarize           ← AI סיכום דבר תורה
/api/admin/social-adapt        ← AI גרסאות וואטסאפ/אינסטגרם
/api/admin/send-newsletter     ← שליחת ניוזלטר לכל המנויים
/api/admin/create-dvar         ← יצירת דבר תורה
/api/admin/create-blog         ← יצירת מאמר
/api/admin/publish             ← פרסום פריט (id או _id)
/api/admin/delete              ← מחיקה
/api/admin/answer-qna          ← תשובה + פרסום שאלה
/api/admin/retag-subtopics     ← שיוך מחדש אוטומטי
```

---

## Phase 3 — עוד לא בוצע
- [ ] אנליטיקס dashboard (Google Analytics 4 / Vercel Analytics UI)
- [ ] היסטוריית גרסאות עם diff
- [ ] מצב תחזוקה
- [ ] גיבוי יומי אוטומטי
- [ ] ניטור שגיאות (Sentry)

---

## קבצים מרכזיים
```
website/
├── app/admin/
│   ├── layout.tsx
│   ├── page.tsx                        ← dashboard
│   ├── login/page.tsx
│   ├── newsletter/page.tsx
│   └── content/
│       ├── videos/page.tsx
│       ├── divrei-tora/page.tsx
│       ├── blog/page.tsx
│       ├── qna/page.tsx
│       └── categories/page.tsx
├── components/admin/
│   ├── AdminSidebar.tsx
│   ├── VideosList.tsx
│   ├── DivreiToraList.tsx              ← כולל Share modal
│   ├── BlogList.tsx
│   ├── QnaList.tsx
│   └── NewsletterCompose.tsx
├── app/api/admin/
│   ├── google-auth/ google-callback/
│   ├── toggle-hidden/ summarize/
│   ├── social-adapt/ send-newsletter/
│   ├── create-dvar/ create-blog/
│   ├── publish/ delete/ answer-qna/
│   └── retag-subtopics/
├── sanity/schema/video.ts              ← שדה hidden
└── sanity/client.ts                    ← queries מסננים hidden!=true
```
