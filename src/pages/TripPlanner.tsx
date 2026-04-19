import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import data from '../data/stops.json'
import { getNextBus } from '../utils/time'

const isWeekend = () => {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export default function TripPlanner() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)

  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const lat = params.get('lat')
  const lng = params.get('lng')

  const noService = isWeekend()

  const city = data.cities.find((c) => c.name === 'Bragança')

  // 🔥 auto detectar parada más cercana
  useEffect(() => {
    if (lat && lng && city) {
      let closest: any = null
      let minDist = Infinity

      city.lines.forEach((line) => {
        line.stops.forEach((stop) => {
          const d =
            Math.abs(stop.coordinates.latitude - Number(lat)) +
            Math.abs(stop.coordinates.longitude - Number(lng))

          if (d < minDist) {
            minDist = d
            closest = stop
          }
        })
      })

      if (closest) {
        handleSearch({
          ...closest,
          type: 'stop',
        })
      }
    }
  }, [lat, lng])

  const handleChange = (text: string) => {
    setQuery(text)

    if (!city || text.length < 2) {
      setSuggestions([])
      return
    }

    const lower = text.toLowerCase()
    let results: any[] = []

    city.lines.forEach((line) => {
      line.stops.forEach((stop) => {
        if (stop.name.toLowerCase().includes(lower)) {
          results.push({
            ...stop,
            type: 'stop',
          })
        }
      })
    })

    const unique = results.filter(
      (v, i, a) =>
        a.findIndex((t) => t.name === v.name) === i
    )

    setSuggestions(unique.slice(0, 6))
  }

  const handleSearch = (target: any) => {
    if (!city || !target) return

    let linesToDestination: any[] = []

    city.lines.forEach((line) => {
      line.stops.forEach((stop) => {
        if (stop.number === target.number) {
          linesToDestination.push({
            line: line.line,
            color: line.color,
            schedules: (stop as any).schedules || [],
          })
        }
      })
    })

    if (linesToDestination.length === 0) return

    const options = linesToDestination.map((l) => {
      const next = getNextBus(l.schedules)
      return next ? { ...l, next } : { ...l, next: null }
    })

    const best = options[0]

    setResult({
      destination: target,
      best,
      schedules: best.schedules || [],
    })

    setSuggestions([])
  }

  return (
    <div style={{
      padding: 20,
      background: '#0D0D0D',
      minHeight: '100vh'
    }}>

      {/* 🔙 VOLVER */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#5CB130',
          fontSize: 14,
          marginBottom: 10,
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        ← Voltar ao mapa
      </button>

      <h2 style={{ color: '#fff', fontSize: 22 }}>
        Planear trajeto
      </h2>

      {/* 📍 DESTINO */}
      {lat && (
        <div style={{
          marginTop: 10,
          background: 'rgba(92,177,48,0.15)',
          border: '1px solid rgba(92,177,48,0.3)',
          padding: 10,
          borderRadius: 10,
          color: '#5CB130',
          fontWeight: 600
        }}>
          📍 Destino selecionado no mapa
        </div>
      )}

      {/* ⚠ FIN DE SEMANA */}
      {noService && (
        <div style={{
          marginTop: 10,
          background: 'rgba(255,80,80,0.15)',
          border: '1px solid rgba(255,80,80,0.3)',
          padding: 10,
          borderRadius: 10,
          color: '#ff4d4d',
          fontWeight: 600
        }}>
          ⚠ Sem serviço ao fim de semana (planeia para semana)
        </div>
      )}

      {/* 🔍 INPUT SOLO SI NO MAPA */}
      {!lat && (
        <>
          <input
            placeholder="Para onde vais?"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              marginTop: 12,
              background: '#1a1a1a',
              color: '#fff',
            }}
          />

          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                setQuery(s.name)
                handleSearch(s)
              }}
              style={{
                padding: 10,
                background: '#1a1a1a',
                marginTop: 5,
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {s.name}
            </div>
          ))}

          <button
            onClick={() => handleSearch(suggestions[0])}
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#5CB130',
              color: '#fff',
              width: '100%',
              fontWeight: 600
            }}
          >
            Buscar
          </button>
        </>
      )}

      {/* RESULTADO */}
      {result && (
        <div style={{
          marginTop: 20,
          background: '#1a1a1a',
          padding: 16,
          borderRadius: 12,
          borderLeft: `4px solid ${result.best.color}`
        }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>
            Ir para {result.destination.name}
          </div>

          <div style={{ marginTop: 8, color: '#aaa' }}>
            Apanha a linha {result.best.line}
          </div>

          {/* TIEMPO */}
          <div style={{ marginTop: 6, color: '#5CB130' }}>
            {noService
              ? 'Sem horário hoje'
              : `Chega em ${result.best.next?.minutes ?? '-'} min`}
          </div>

          {/* 🔥 HORARIOS */}
          <div style={{ marginTop: 15 }}>
            <div style={{
              color: '#aaa',
              fontSize: 12,
              marginBottom: 6
            }}>
              Horários desta linha:
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6
            }}>
              {result.schedules.length > 0 ? (
                result.schedules.map((t: string, i: number) => (
                  <div key={i} style={{
                    background: '#2a2a2a',
                    padding: '6px 10px',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12
                  }}>
                    {t}
                  </div>
                ))
              ) : (
                <div style={{ color: '#777', fontSize: 12 }}>
                  Horários não disponíveis
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}