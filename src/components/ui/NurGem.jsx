// Гранёный "камень" — бейдж уровня НУР вместо эмодзи.
export default function NurGem({ light, dark, size = 20, glow = false }) {
  return (
    <span
      style={{
        position: 'relative', display: 'inline-block', flexShrink: 0,
        width: size, height: size,
        clipPath: 'polygon(50% 0%, 100% 36%, 81% 100%, 19% 100%, 0% 36%)',
        background: `linear-gradient(140deg, ${light}, ${dark})`,
        boxShadow: '0 1px 4px rgba(0,0,0,.4)',
        filter: glow ? `drop-shadow(0 0 ${Math.max(5, size * 0.22)}px ${light})` : undefined,
      }}
    >
      <span
        style={{
          position: 'absolute', top: '13%', left: '23%', width: '28%', height: '16%',
          background: 'rgba(255,255,255,.65)',
          clipPath: 'polygon(0 0, 100% 0, 55% 100%, 0 55%)',
        }}
      />
    </span>
  )
}
