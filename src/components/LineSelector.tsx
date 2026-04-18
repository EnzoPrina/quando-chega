export default function LineSelector({ lines, selected, onSelect }: any) {
  return (
    <div style={wrapper}>
      {lines.map((l: any, i: number) => (
        <div
          key={i}
          onClick={() => onSelect(l.line)}
          style={{
            ...button,
            background: l.color,
            border: selected === l.line ? '2px solid white' : 'none',
          }}
        >
          {l.line}
        </div>
      ))}
    </div>
  )
}

const wrapper = {
  position: 'fixed',
  top: 12,
  left: 10,
  right: 10,
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  zIndex: 1000,
}

const button = {
  padding: '8px 14px',
  borderRadius: 8,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  minWidth: 60,
  textAlign: 'center' as const,
}