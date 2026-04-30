export default function manifest() {
  return {
    name: 'שיעורי הרב רועי אמגר',
    short_name: 'הרב אמגר',
    description: 'שיעורי תורה, הלכה, אמונה וזוגיות — הרב רועי אמגר',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a2744',
    theme_color: '#1a2744',
    lang: 'he',
    dir: 'rtl',
    orientation: 'portrait',
    icons: [
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
