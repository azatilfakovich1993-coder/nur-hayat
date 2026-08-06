import { NUR_LEVELS } from '../../utils/nur'
import NurGem from '../ui/NurGem'

export default function NurLadder() {
  return (
    <div style={s.wrap}>
      {NUR_LEVELS.map(lvl => (
        <div key={lvl.label} style={s.chip}>
          <NurGem light={lvl.light} dark={lvl.dark} size={28} glow={lvl.max === Infinity} />
          <div style={{ ...s.label, color: lvl.color }}>{lvl.label}</div>
          <div style={s.range}>{lvl.min}{lvl.max === Infinity ? '+' : `–${lvl.max}`}</div>
        </div>
      ))}
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 2px 4px',
    marginTop: 16, scrollbarWidth: 'none',
  },
  chip: {
    flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    width: 72, padding: '12px 6px 10px', borderRadius: 14,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
  },
  label: { fontSize: 10.5, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 },
  range: { fontSize: 9, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' },
}
