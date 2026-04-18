import './nearby.css'
import { formatTime } from '../utils/time'

export default function NearbyStops({ stops, onSelect, bestStop }: any) {
  return (
    <div className="cards-wrapper">
      {stops.map((stop: any, i: number) => {
        const isBest = bestStop && stop.name === bestStop.name

        return (
          <div
            key={i}
            className="card"
            onClick={() => onSelect(stop)}
            style={{
              border: isBest ? '2px solid #00d4ff' : 'none',
              transform: isBest ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {/* 🔥 MEJOR OPCIÓN */}
            {isBest && (
              <div
                style={{
                  fontSize: 11,
                  color: '#00d4ff',
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                Melhor opção
              </div>
            )}

            <h3 style={{ fontWeight: 500 }}>{stop.name}</h3>

            <div className="lines">
              {stop.lines.map((line: any) => (
                <span
                  key={line.line}
                  className="badge"
                  style={{ background: line.color }}
                >
                  {line.line}
                </span>
              ))}
            </div>

            <p style={{ fontSize: 12, color: '#aaa' }}>
              {Math.round(stop.distance)} m
            </p>

            <div
              style={{
                marginTop: 6,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {stop.next !== null
                ? formatTime(stop.next)
                : 'Sem mais hoje'}
            </div>
          </div>
        )
      })}
    </div>
  )
}