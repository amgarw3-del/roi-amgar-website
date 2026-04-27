# הבוט החכם — מדריך הקמה (חינמי 100%)

הבוט מבוסס על **Gemini 2.5 Flash** עם רשימת כל מסמכי האתר ב-context. ללא vector DB, ללא embeddings, ללא חשבונות חדשים.

## איך זה עובד

1. בכניסת המשתמש לבוט — שרת ה-Vercel טוען מ-Sanity את כל המסמכים (שיעורים, דברי תורה, מאמרים, שו"ת) ושומר ב-cache בזיכרון (TTL 10 דקות).
2. בכל שיחה — שולחים ל-Gemini Flash את הרשימה הקומפקטית (כותרת + תקציר + slug של כל מסמך) + השאלה.
3. Gemini עונה בעברית, עם ציטוטים [1], [2], ובסוף בלוק `@@SOURCES@@` עם slugs.
4. השרת מפענח את ה-slugs, ממפה לכרטיסיות מקור (כולל URL), ושולח ל-frontend.

## תלויות

- `GEMINI_API_KEY` — **כבר קיים בפרויקט** (משמש את `/api/admin/summarize`).
- `SANITY_WEBHOOK_SECRET` — מחרוזת אקראית; אופציונלי (בלעדיו ה-cache פשוט יתרענן כל 10 דקות).

## מה צריך להגדיר

### חובה: 0 דברים
אם `GEMINI_API_KEY` כבר קיים ב-Vercel — הכל יעבוד מיד אחרי deploy.

### מומלץ: הגדרת Webhook ל-sync מיידי
אחרת המסמכים שתפרסם ב-Sanity יופיעו בבוט תוך עד 10 דקות (TTL של cache).

1. הגדר `SANITY_WEBHOOK_SECRET` ב-Vercel — מחרוזת אקראית כלשהי, למשל:
   ```powershell
   [guid]::NewGuid().ToString("N")
   ```
2. ב-https://www.sanity.io/manage/project/bssgoew8 → API → Webhooks → Create webhook:
   - **URL**: `https://website-seven-kappa-25.vercel.app/api/embed-content`
   - **Dataset**: `production`
   - **Trigger on**: Create, Update, Delete
   - **Filter**: `_type in ["video", "divarTora", "blogPost", "qna"]`
   - **HTTP method**: POST
   - **HTTP Headers**: `Authorization: Bearer <אותה מחרוזת>`

## בדיקה ידנית

```bash
curl -X POST https://website-seven-kappa-25.vercel.app/api/reindex \
  -H "Authorization: Bearer $SANITY_WEBHOOK_SECRET"
```

החזר ה-JSON יראה:
```json
{ "ok": true, "total": 87, "breakdown": { "video": 30, "divarTora": 40, "blogPost": 7, "qna": 10 } }
```

## עלות

free tier של Gemini 2.5 Flash:
- 10 בקשות / דקה
- 250 בקשות / יום
- מספיק בהחלט לאתר אישי

עלות חודשית: **0₪**.

## קבצים שנוצרו

```
lib/chat/
  doc-index.ts          — Sanity fetch + cache + index block
  extract-text.ts       — חילוץ plain text מ-schemas

app/api/
  chat/route.ts         — Gemini Flash streaming + ציטוטים
  embed-content/route.ts — webhook (מנקה cache)
  reindex/route.ts      — refresh ידני

components/chat/
  ChatBubble.tsx, ChatPanel.tsx, ChatMessage.tsx,
  SourceCard.tsx, useChat.ts, types.ts
```

## פתרון בעיות

### "GEMINI_API_KEY missing"
לא מוגדר ב-Vercel. בדוק ב-Settings → Environment Variables.

### הבוט לא מחזיר מקורות
- ייתכן ש-Gemini לא הצליח לפענח את הפורמט. בדוק ב-Vercel logs.
- אפשר להוריד את ה-temperature ב-`app/api/chat/route.ts`.

### תוכן חדש לא מופיע בבוט
- חכה עד 10 דקות (TTL של cache), או
- הרץ `curl /api/reindex` עם הסוד, או
- הגדר webhook ב-Sanity (ראה לעיל).

### חריגה ממכסת free tier
לא אמור לקרות באתר אישי, אבל אם כן:
- שדרג ל-tier 1 ב-Gemini (~$0.10 ל-1M input tokens, עדיין זול)
- או הוסף rate limit אגרסיבי יותר ב-`route.ts`.
