import { useState } from 'react'

export default function LineDrawer({ lines, selected, onSelect }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = lines.filter((l: any) =>
    l.line.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* 🔥 BOTÓN FLOTANTE */}
      <button style={button} onClick={() => setOpen(!open)}>
        🚏
      </button>

      {/* 🔥 PANEL */}
      <div
        style={{
          ...drawer,
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* HEADER */}
        <div style={header}>
          <input
            placeholder="Pesquisar linha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />
        </div>

        {/* LISTA */}
        <div style={list}>
          {filtered.map((l: any, i: number) => (
            <div
              key={i}
              onClick={() => {
                onSelect(l.line)
                setOpen(false)
              }}
              style={{
                ...item,
                border:
                  selected === l.line
                    ? '2px solid white'
                    : '2px solid transparent',
                background: l.color,
              }}
            >
              {l.line}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
const button = {
  position: 'fixed' as const,
  bottom: 250,
  right: 20,
  width: 65,
  height: 65,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(12px)',
  color: '#fff',
  fontSize: 36,
  cursor: 'pointer',
  zIndex: 1001,
}

const drawer = {
  position: 'fixed' as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: '65%',
  background: 'rgba(20,20,20,0.95)',
  backdropFilter: 'blur(20px)',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 16,
  zIndex: 1000,
  transition: 'transform 0.35s ease',
}

const header = {
  marginBottom: 12,
}

const input = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  outline: 'none',
}

const list = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 10,
}

const item = {
  padding: '10px 14px',
  borderRadius: 10,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
}