# מדריך הקמה: אוטומציית הפצת דברי תורה

המערכת שולחת לרב בוואטסאפ, 30 שעות לפני כל אירוע יהודי (שבת/חג/צום/יום לאומי) שיש לו דברי תורה במאגר:
- הודעה מסוגננת (כותרת + טיזר + קישור קצר + ניוזלטר + ברכה דינמית)
- תמונה 1:1 אומנותית (1024×1024) שנוצרת ע"י Gemini AI

## דרישות אפס-עלות
- **CallMeBot** — שליחת WhatsApp חינמית
- **Gemini API** — free tier (1,500 בקשות/יום)
- **Vercel Cron** — כלול בתכנית
- **קיצור URL פנימי** — `/d/[id]`

## שלב 1: התקנת dependencies

```bash
cd "C:\Users\amgar\OneDrive\שולחן העבודה\קלוד קוד\אתר הרב רועי אמגר\website"
npm install @hebcal/core
```

(`@google/generative-ai` ו-`@sanity/client` כבר מותקנים)

## שלב 2: הקמת CallMeBot (חד-פעמי, 2 דקות)

1. הוסף את הטלפון הזה לאנשי הקשר ב-WhatsApp: **+34 644 51 95 23**
   קרא לו: **CallMeBot**
2. שלח אליו הודעה: `I allow callmebot to send me messages`
3. תקבל בחזרה API key (לדוגמה: `1234567`)
4. שמור את המספר וה-API key

## שלב 3: יצירת Gemini API key (30 שניות)

1. כנס ל: https://aistudio.google.com/app/apikey
2. לחץ "Create API key"
3. העתק את המפתח

## שלב 4: הגדרת env vars

### מקומית (`.env.local`):
```env
RABBI_PHONE=972501234567
CALLMEBOT_API_KEY=1234567
GEMINI_API_KEY=AIza...
NEWSLETTER_URL=https://website-seven-kappa-25.vercel.app/#newsletter
NEXT_PUBLIC_SITE_URL=https://website-seven-kappa-25.vercel.app
CRON_SECRET=<מחרוזת אקראית, למשל: openssl rand -hex 32>
```

### ב-Vercel (Production):
לך ל: Vercel Dashboard → Project → Settings → Environment Variables
הוסף את כל המשתנים לעיל (CRON_SECRET יתעדכן אוטומטית ע"י Vercel).

## שלב 5: deploy

```bash
git add .
git commit -m "feat: weekly divrei tora WhatsApp automation"
git push
```

ה-cron יופעל אוטומטית ב-Production.

## שלב 6: בדיקה ידנית (dry run)

לבדוק בלי לשלוח:
```
https://website-seven-kappa-25.vercel.app/api/cron/weekly-divrei?dry=true&date=2026-09-25
```

(הוסף header: `Authorization: Bearer <CRON_SECRET>`)

לבדיקה חיה לטלפון שלך:
```
https://website-seven-kappa-25.vercel.app/api/cron/weekly-divrei?date=2026-09-25
```

## שלב 7: אישור עיצוב התמונה

לאחר ה-deploy:
1. הפעל dry-run ל-3 אירועים שונים (פרשת בראשית, פסח, ל"ג בעומר)
2. כל תמונה תיווצר ותישמר ב-Sanity (collection: `eventImage`)
3. סקור ידנית ב-Sanity Studio את התמונות
4. אם תמונה נראית טובה → סמן `approvedByRabbi=true` (תישמש שוב בשנים הבאות)
5. אם לא טובה → מחק מ-Sanity (ייווצר מחדש בקריאה הבאה) או עדכן את ה-prompt ב-`lib/image-prompts.ts`

## שינוי תזמון

החלון הנוכחי: **29-31 שעות לפני האירוע**.
לשינוי: עדכן `WINDOW_MIN` ו-`WINDOW_MAX` ב-`app/api/cron/weekly-divrei/route.ts`.

## פתרון בעיות

### WhatsApp לא מגיע
- בדוק שהטלפון בפורמט `972...` (בלי + או רווחים)
- בדוק שה-API key תקין דרך URL ישיר:
  `https://api.callmebot.com/whatsapp.php?phone=972...&text=test&apikey=...`

### תמונה לא נוצרת
- בדוק שיש GEMINI_API_KEY תקין
- בדוק quota: 1,500/יום ב-free tier (https://aistudio.google.com/app/quota)
- בדוק את הלוג של ה-cron route

### לא נשלח דבר תורה — קיבלתי התראה
- אין דבר תורה במאגר Sanity המקושר ל-subTopic של האירוע
- העלה דבר תורה חדש דרך הסקיל `divrei-tora-publisher`
- וודא ש-subTopic מקושר ל-group הנכון (parasha/moed/fast/national)

## ארכיטקטורה
ראה: `C:\Users\amgar\.claude\plans\abstract-napping-muffin.md`
