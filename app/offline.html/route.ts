import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

const HTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>אין חיבור | הרב רועי אמגר</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;900&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a2744;
      color: #f5f0e8;
      font-family: 'Heebo', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: #b87333; margin: 0 auto 24px;
    }
    h1 { font-size: 28px; font-weight: 900; margin-bottom: 12px; }
    p { font-size: 16px; color: #c8a96e; line-height: 1.7; max-width: 320px; margin-bottom: 32px; }
    .divider {
      width: 120px; height: 1px; background: #b87333;
      margin: 0 auto 32px;
    }
    button {
      background: #b87333; color: #fff;
      border: none; border-radius: 24px;
      padding: 14px 32px; font-size: 15px;
      font-family: 'Heebo', sans-serif; font-weight: 700;
      cursor: pointer;
    }
    button:active { opacity: 0.85; }
  </style>
</head>
<body>
  <div class="dot"></div>
  <h1>אין חיבור לאינטרנט</h1>
  <div class="divider"></div>
  <p>התוכן ייטען כשהחיבור יחזור. דפים שביקרת בהם קודם עשויים להיות זמינים.</p>
  <button onclick="window.location.reload()">נסה שוב</button>
</body>
</html>`

export function GET() {
  return new NextResponse(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
