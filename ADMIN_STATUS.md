# סטטוס לוח מנהל — אתר הרב רועי אמגר

## עדכון אחרון: 2026-04-29

---

## מה הושלם ✅

### Phase 1 — ליבה
- **Auth:** Google OAuth ידני
- **Layout:** sidebar עברי RTL, מובייל, `SiteShell`
- **Dashboard:** KPIs + פעולות מהירות
- **סרטונים:** CRUD מלא + `hidden` toggle + sync
- **דברי תורה:** CRUD + AI summarize
- **שאל את הרב:** תור שאלות + עורך תשובה + toggle פרסום
- **קטגוריות:** CRUD מלא
- **מאמרים:** CRUD מלא (כולל Edit)
- **ניוזלטר:** עורך + שליחה + ניהול מנויים + ייצוא CSV

### Phase 2 — שיווק והפצה
- **שיתוף חברתי:** Share modal (Claude Haiku) על כל דבר תורה
- **Vercel Analytics**

### Phase 3 — ניהול תוכן ויזואלי (חדש)
- **הרצאות:** ניהול מלא — הרצאות + המלצות + גלריה + FAQ (4 טאבים)
- **עמוד הבית:** עורך Hero (כותרת/תת/תמונה/CTA) + סידור בלוקים עם ↑/↓ + הסתרה/הצגה

---

## ENV vars (ב-Vercel)

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAILS=amgarw3@gmail.com
NEXT_PUBLIC_SANITY_PROJECT_ID=...
SANITY_API_TOKEN=...   (token עם הרשאות write)
```

---

## ניווט Sidebar (סדר)
1. דשבורד
2. עמוד הבית (`/admin/content/homepage`)
3. סרטונים (`/admin/content/videos`)
4. דברי תורה (`/admin/content/divrei-tora`)
5. מאמרים (`/admin/content/blog`)
6. שאל את הרב (`/admin/content/qna`)
7. הרצאות (`/admin/content/lectures`)
8. קטגוריות (`/admin/content/categories`)
9. ניוזלטר (`/admin/newsletter`)

---

## API Routes (חדשים בעדכון זה)
```
/api/admin/upload-image          ← העלאת תמונה ל-Sanity assets
/api/admin/save-lecture          ← create/update הרצאה
/api/admin/save-testimonial      ← create/update המלצה
/api/admin/save-gallery-image    ← create/update תמונת גלריה
/api/admin/save-faq              ← create/update שאלה נפוצה (lectureFaq)
/api/admin/save-video            ← create/update סרטון
/api/admin/update-blog           ← עריכת מאמר
/api/admin/get-blog              ← טעינת מאמר לעריכה (כולל body כטקסט)
/api/admin/save-category         ← create/update קטגוריה
/api/admin/save-subscriber       ← create/update מנוי
/api/admin/export-subscribers    ← ייצוא CSV
/api/admin/save-homepage         ← שמירת singleton עמוד הבית
```

---

## סכמות חדשות ב-Sanity
- `lectureFaq` — שאלות נפוצות (question, answer, order, published)
- `homepage` — singleton עמוד הבית (heroTitle, heroSubtitle, heroImage, heroCtaLabel, heroCtaHref, blocks[])

---

## קבצים מרכזיים
```
website/
├── app/admin/
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── newsletter/page.tsx              ← +SubscribersList
│   └── content/
│       ├── homepage/page.tsx            ← חדש
│       ├── videos/page.tsx              ← +categories
│       ├── divrei-tora/page.tsx
│       ├── blog/page.tsx
│       ├── qna/page.tsx
│       ├── lectures/page.tsx            ← חדש (4 טאבים)
│       └── categories/page.tsx          ← מ-view-only ל-CRUD
├── components/admin/
│   ├── AdminSidebar.tsx                 ← +הרצאות, עמוד הבית
│   ├── VideosList.tsx                   ← +CRUD
│   ├── DivreiToraList.tsx
│   ├── BlogList.tsx                     ← +Edit
│   ├── QnaList.tsx
│   ├── CategoriesList.tsx               ← חדש
│   ├── LecturesPanel.tsx                ← חדש (Lectures+Testimonials+Gallery+FAQ)
│   ├── SubscribersList.tsx              ← חדש
│   ├── HomepageEditor.tsx               ← חדש
│   └── NewsletterCompose.tsx
├── sanity/schema/
│   ├── lectureFaq.ts                    ← חדש
│   ├── homepage.ts                      ← חדש
│   └── index.ts                         ← +imports
└── app/page.tsx                         ← רנדר לפי orderedBlocks מ-Sanity
```

---

## Phase 4 — לעתיד (לא בוצע)
- [ ] drag-and-drop אמיתי לבלוקים בעמוד הבית (כיום ↑/↓)
- [ ] אנליטיקס dashboard
- [ ] היסטוריית גרסאות
- [ ] Sentry / ניטור שגיאות
- [ ] גיבוי יומי
