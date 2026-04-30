import { ImageResponse } from 'next/og'

// Generate at request time, not build time (avoids font-fetch failures during prerender)
export const dynamic = 'force-dynamic'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

async function loadHebrewFont(): Promise<ArrayBuffer | null> {
  try {
    const text = 'הרב רועי אמגר תורה לחיים שיעורים ולימוד ◆'
    // Firefox 27 UA → Google Fonts returns woff1 (Satori supports woff but not woff2)
    const css = await fetch(
      `https://fonts.googleapis.com/css?family=Frank+Ruhl+Libre:700&text=${encodeURIComponent(text)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0',
        },
      }
    ).then((r) => r.text())
    const fontUrl = css.match(/url\(([^)]+)\)/)?.[1]
    if (!fontUrl) return null
    const buffer = await fetch(fontUrl).then((r) => r.arrayBuffer())
    if (buffer.byteLength < 100) return null
    const magic = new TextDecoder().decode(buffer.slice(0, 4))
    if (magic === 'wOF2') return null
    return buffer
  } catch {
    return null
  }
}

export default async function AppleIcon() {
  const fontData = await loadHebrewFont()
  const fonts = fontData
    ? [{ name: 'FrankRuhl', data: fontData, style: 'normal' as const, weight: 700 as const }]
    : []
  const fontFamily = fontData ? 'FrankRuhl' : 'serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1a2744 0%, #2e3f6e 100%)',
          gap: '4px',
          fontFamily,
        }}
      >
        <div style={{ color: '#f5c96e', fontSize: 10, fontWeight: 700, letterSpacing: '1px', display: 'flex' }}>
          ◆ םייחל הרות ◆
        </div>
        <div style={{ width: '106px', height: '1px', background: '#b87333', display: 'flex' }} />
        <div
          style={{
            color: '#ffffff',
            fontSize: 27,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
            display: 'flex',
          }}
        >
          רגמא יעור ברה
        </div>
        <div style={{ width: '106px', height: '1px', background: '#b87333', display: 'flex' }} />
        <div style={{ color: '#c8a96e', fontSize: 9, fontStyle: 'italic', display: 'flex' }}>
          דומילו םירועיש
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
