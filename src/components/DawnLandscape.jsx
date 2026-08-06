// Атмосферный фон для шапок обучающих экранов — рассвет над озером.
// Лёгкая SVG-иллюстрация (не фото), вписана в тёмно-золотую палитру приложения.
export default function DawnLandscape() {
  return (
    <svg
      viewBox="0 0 400 120" preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.55 }}
    >
      <defs>
        <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#0d0d18" />
          <stop offset="55%" stopColor="#2a1f2e" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="dawnSun" cx="50%" cy="78%" r="45%">
          <stop offset="0%"  stopColor="#f8dfa0" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#c9a84c" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dawnWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#c9a84c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0d0d18" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="120" fill="url(#dawnSky)" />
      <rect x="0" y="0" width="400" height="120" fill="url(#dawnSun)" />
      {/* Дальние горы */}
      <polygon points="0,78 40,52 90,74 140,46 200,72 260,50 320,76 400,58 400,120 0,120"
        fill="#3b3550" opacity="0.55" />
      {/* Ближние горы */}
      <polygon points="0,95 60,66 120,90 180,60 250,92 340,64 400,88 400,120 0,120"
        fill="#14121e" opacity="0.85" />
      {/* Озеро — отражение рассвета */}
      <rect x="0" y="95" width="400" height="25" fill="url(#dawnWater)" />
    </svg>
  )
}
