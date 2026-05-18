import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import data from '../data/stops.json'
import { getNextBus } from '../utils/time'
import places from '../data/places.json'

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

const getWalkingTime = (meters: number) => {
  const speed = 1.4
  return Math.round(meters / speed / 60)
}

const isStopBeforeDestination = (
  lineStops: any[], 
  stopNumber: string, 
  destinationNumber: string
): boolean => {
  const stopIndices = lineStops.map((s, idx) => ({ 
    number: s.number, 
    index: idx 
  }))
  
  const stopIndex = stopIndices.find(s => s.number === stopNumber)?.index ?? -1
  const destIndex = stopIndices.find(s => s.number === destinationNumber)?.index ?? -1
  
  return stopIndex !== -1 && destIndex !== -1 && stopIndex < destIndex
}

export default function TripPlanner() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [showSchedules, setShowSchedules] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const lat = params.get('lat')
  const lng = params.get('lng')
  const isMapSelection = lat && lng

  const city = data.cities.find((c) => c.name === 'Bragança')

  // Obtener GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error GPS:', error)
          setUserLocation({ lat: 41.8065, lng: -6.7562 })
        }
      )
    } else {
      setUserLocation({ lat: 41.8065, lng: -6.7562 })
    }
  }, [])


  useEffect(() => {
const handleResize = () => {
  setIsMobile(window.innerWidth < 768)
}

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])

  // Buscar destino cuando hay selección del mapa
  useEffect(() => {
    if (!isMapSelection || !city) return
    
    console.log('Destino seleccionado:', lat, lng)
    
    let destination: any = null
    
    // Buscar en paradas
    for (const line of city.lines) {
      for (const stop of line.stops) {
        if (Math.abs(stop.coordinates.latitude - Number(lat)) < 0.001 &&
            Math.abs(stop.coordinates.longitude - Number(lng)) < 0.001) {
          destination = { ...stop, type: 'stop' }
          break
        }
      }
      if (destination) break
    }
    
    // Buscar en places
    if (!destination) {
      for (const place of places) {
        if (Math.abs(place.coordinates.latitude - Number(lat)) < 0.001 &&
            Math.abs(place.coordinates.longitude - Number(lng)) < 0.001) {
          destination = { ...place, type: 'place' }
          break
        }
      }
    }
    
    if (destination) {
      console.log('Destino encontrado:', destination.name)
      handleSearch(destination)
    } else {
      console.log('Destino no encontrado')
    }
  }, [lat, lng, city])

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
          results.push({ ...stop, type: 'stop' })
        }
      })
    })

    places.forEach((place) => {
      if (place.name.toLowerCase().includes(lower)) {
        results.push({ ...place, type: 'place' })
      }
    })

    setSuggestions(results.slice(0, 6))
  }

  const handleSearch = (target: any) => {
    console.log('handleSearch llamado con:', target.name)
    
    if (!city) return

    // Procesar place a parada
    let finalDestination: any = target
    let originalPlaceName: string | null = null
    let walkingToDestination = 0

    if (target.type === 'place') {
      originalPlaceName = target.name
      
      let closestStop: any = null
      let minDistance = Infinity
      
      city.lines.forEach(line => {
        line.stops.forEach((stop: any) => {
          const distance = getDistance(
            target.coordinates.latitude,
            target.coordinates.longitude,
            stop.coordinates.latitude,
            stop.coordinates.longitude
          )
          if (distance < minDistance) {
            minDistance = distance
            closestStop = stop
          }
        })
      })
      
      if (closestStop) {
        finalDestination = { ...closestStop, type: 'stop' }
        walkingToDestination = getWalkingTime(minDistance)
      } else {
        return
      }
    }

    // Si no hay GPS, usar ubicación por defecto
    let userLat = userLocation?.lat ?? 41.8065
    let userLng = userLocation?.lng ?? -6.7562

    // Encontrar líneas que van al destino
    const linesToDestination: any[] = []
    
    city.lines.forEach(line => {
      const hasDestination = line.stops.some((stop: any) => stop.number === finalDestination.number)
      if (hasDestination) {
        linesToDestination.push(line)
      }
    })

    if (linesToDestination.length === 0) {
      setResult({ error: '🚌 Nenhuma linha atende este destino' })
      return
    }

    // Evaluar todas las opciones
    const allOptions: any[] = []

    linesToDestination.forEach(line => {
      const stopsInOrder = line.stops
      
      stopsInOrder.forEach((stop: any) => {
        // Verificar que la parada está antes del destino
        const isBefore = isStopBeforeDestination(
          stopsInOrder,
          stop.number,
          finalDestination.number
        )
        
        if (!isBefore) return
        
        // Distancia al usuario
        const distanceToUser = getDistance(
          userLat,
          userLng,
          stop.coordinates.latitude,
          stop.coordinates.longitude
        )
        
        if (distanceToUser > 800) return
        
        const schedules = (stop as any).schedules || []
        const nextBus = getNextBus(schedules)
        
        if (!nextBus) return
        
        const walkingToStop = getWalkingTime(distanceToUser)
        const totalTime = walkingToStop + nextBus.minutes
        
        allOptions.push({
          stop,
          line: line.line,
          color: line.color,
          walkingToStop,
          waitingTime: nextBus.minutes,
          totalTime,
          nextBus,
          walkingToDestination
        })
      })
    })

    if (allOptions.length === 0) {
      setResult({
        error: '😕 Nenhuma parada próxima com ônibus para este destino',
        destination: finalDestination
      })
      return
    }

    // Ordenar y mostrar
    allOptions.sort((a, b) => a.totalTime - b.totalTime)

    const bestOption = allOptions[0]
    const alternatives = allOptions.slice(1, 4)

    setResult({
      destination: finalDestination,
      originalPlace: originalPlaceName,
      walkingToDestination,
      best: {
        stop: bestOption.stop,
        line: bestOption.line,
        color: bestOption.color,
        walkingToStop: bestOption.walkingToStop,
        waitingTime: bestOption.waitingTime,
        totalTime: bestOption.totalTime,
        nextBus: bestOption.nextBus
      },
      alternatives: alternatives.map(alt => ({
        stop: alt.stop,
        line: alt.line,
        color: alt.color,
        walkingToStop: alt.walkingToStop,
        waitingTime: alt.waitingTime,
        totalTime: alt.totalTime,
        nextBus: alt.nextBus
      }))
    })

    setSuggestions([])
  }

  return (
  <>
<style>
{`
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0px);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}
`}
</style>


    <div style={{
      padding: 20,
      background: '#0D0D0D',
      minHeight: '100vh'
    }}>
      <button onClick={() => navigate('/')} style={{
        background: 'transparent',
        border: 'none',
        color: '#5CB130',
        fontWeight: 600,
        cursor: 'pointer'
      }}>
        ← Voltar ao mapa
      </button>

      <h2 style={{ color: '#fff' }}>Planear trajeto</h2>

      {!userLocation && (
        <div style={{
          background: 'rgba(255,100,0,0.15)',
          padding: 10,
          borderRadius: 10,
          color: '#ff9900',
          marginBottom: 15
        }}>
          📡 Obtendo localização...
        </div>
      )}

      {!isMapSelection && (
        <>
          <input
            placeholder="Para onde vais? (ex: Pingo Doce, Hospital...)"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              background: '#1a1a1a',
              color: '#fff',
              border: 'none'
            }}
          />

          {suggestions.map((s, i) => (
            <div key={i} onClick={() => {
              setQuery(s.name)
              handleSearch(s)
            }} style={{
              padding: 10,
              background: '#1a1a1a',
              marginTop: 5,
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer'
            }}>
              {s.name}
            </div>
          ))}
        </>
      )}

      {isMapSelection && !result && (
        <div style={{
          marginTop: 20,
          background: '#1a1a1a',
          padding: 20,
          borderRadius: 12,
          color: '#aaa',
          textAlign: 'center'
        }}>
          🔍 Procurando rotas para o destino selecionado...
        </div>
      )}

      {result?.error && (
        <div style={{
          marginTop: 20,
          background: '#1a1a1a',
          padding: 20,
          borderRadius: 12,
          color: '#ff6666',
          textAlign: 'center'
        }}>
          {result.error}
        </div>
      )}


{result?.best && (
<div style={{
  marginTop: 20,
  background: '#1a1a1a',
  padding: isMobile ? 12 : 16,
  borderRadius: 12,
  borderLeft: `4px solid ${result.best.color}`
}}>
  
  {/* DESTINO */}
  <div style={{
    color: '#fff',
    fontWeight: 700,
    fontSize: isMobile ? 18 : 22,
    lineHeight: 1.2
  }}>
    🎯 {result.originalPlace || result.destination.name}
  </div>

  <div style={{
    color: '#888',
    marginTop: 4,
    fontSize: isMobile ? 12 : 14
  }}>
    A partir da tua localização atual
  </div>

  {/* CARD PRINCIPAL */}
  <div style={{
    marginTop: 16,
    background: '#0D0D0D',
    padding: isMobile ? 12 : 16,
    borderRadius: 12
  }}>

    <div style={{
      color: '#5CB130',
      fontWeight: 700,
      marginBottom: 14,
      fontSize: isMobile ? 13 : 15
    }}>
     ⭐ Melhor forma de chegar agora
    </div>

{/* PASSOS */}
<div style={{
  display: 'grid',
  gridTemplateColumns:
    isMobile
      ? '1fr'
      : 'repeat(3, 1fr)',
  gap: 14,
  marginTop: 14
}}>

  {/* PASSO 1 */}
  <div style={{
    transition: 'all 0.25s ease',
cursor: 'pointer',
animation: 'fadeUp 0.4s ease',
    background: '#141414',
    borderRadius: 14,
    padding: isMobile ? 14 : 22,
    border: '1px solid #222',

    display: 'flex',
    flexDirection:
isMobile        ? 'row'
        : 'column',

    alignItems:
isMobile        ? 'center'
        : 'flex-start',

    gap: isMobile ? 14 : 18,

    minHeight:
      isMobile
        ? 'unset'
        : 240
  }}
  
   onMouseEnter={(e) => {
    if (isMobile) return

    e.currentTarget.style.transform = 'translateY(-4px)'
    e.currentTarget.style.borderColor = '#5CB130'
    e.currentTarget.style.boxShadow = '0 0 18px rgba(92,177,48,0.25)'
  }}

  onMouseLeave={(e) => {
    if (isMobile) return

    e.currentTarget.style.transform = 'translateY(0px)'
    e.currentTarget.style.borderColor = '#222'
    e.currentTarget.style.boxShadow = 'none'
  }}>

    

    <div style={{
      fontSize: isMobile ? 28 : 42,
      flexShrink: 0
    }}>
      🚶
    </div>

    <div>

      <div style={{
        color: '#777',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8
      }}>
        Passo 1
      </div>

      <div style={{
        color: '#fff',
        fontWeight: 700,
        fontSize: isMobile ? 18 : 28,
        lineHeight: 1.1
      }}>
        Caminha {result.best.walkingToStop} min
      </div>

      <div style={{
        color: '#5CB130',
        marginTop: 8,
        fontWeight: 600,
        fontSize: isMobile ? 13 : 16
      }}>
        {result.best.stop.name}
      </div>

    </div>
  </div>

  {/* PASSO 2 */}
  <div style={{
    transition: 'all 0.25s ease',
cursor: 'pointer',
animation: 'fadeUp 0.4s ease',
    background: '#141414',
    borderRadius: 14,
    padding: isMobile ? 14 : 22,
    border: '1px solid #222',

    display: 'flex',
    flexDirection:
     isMobile
        ? 'row'
        : 'column',

    alignItems:
      isMobile
        ? 'center'
        : 'flex-start',

    gap: isMobile ? 14 : 18,

    minHeight:
      isMobile
        ? 'unset'
        : 240
  }}  onMouseEnter={(e) => {
    if (isMobile) return

    e.currentTarget.style.transform = 'translateY(-4px)'
    e.currentTarget.style.borderColor = '#5CB130'
    e.currentTarget.style.boxShadow = '0 0 18px rgba(92,177,48,0.25)'
  }}

  onMouseLeave={(e) => {
    if (isMobile) return

    e.currentTarget.style.transform = 'translateY(0px)'
    e.currentTarget.style.borderColor = '#222'
    e.currentTarget.style.boxShadow = 'none'
  }}>

    <div style={{
      fontSize: isMobile ? 28 : 42,
      flexShrink: 0
    }}>
      🚌
    </div>

    <div>

      <div style={{
        color: '#777',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8
      }}>
        Passo 2
      </div>

      <div style={{
        color: '#fff',
        fontWeight: 800,
        fontSize: isMobile ? 28 : 44,
        lineHeight: 1
      }}>
        {result.best.nextBus.inactive
  ? result.best.nextBus.time
  : result.best.nextBus.time}
      </div>

      <div style={{
        color: '#fff',
        marginTop: 10,
        fontWeight: 600,
        fontSize: isMobile ? 14 : 18
      }}>
        Linha {result.best.line}
      </div>

<div style={{
  color:
    result.best.nextBus.inactive
      ? '#ff6666'
      : result.best.waitingTime <= 5
      ? '#ff6666'
      : result.best.waitingTime <= 10
      ? '#ffcc66'
      : '#888',

  marginTop: 8,
  fontSize: isMobile ? 12 : 14,
  fontWeight: 600,

  animation:
    result.best.waitingTime <= 5
      ? 'pulse 1.5s infinite'
      : 'none',
}}>

  {result.best.nextBus.inactive
    ? 'Consulta horários amanhã'
    : result.best.waitingTime <= 5
    ? `Chega em ${result.best.waitingTime} min`
    : `Daqui a ${result.best.waitingTime} min`}
</div>

    </div>
  </div>

  {/* PASSO 3 */}
  <div style={{
    transition: 'all 0.25s ease',
cursor: 'pointer',
animation: 'fadeUp 0.4s ease',
    background: '#141414',
    borderRadius: 14,
    padding: isMobile ? 14 : 22,
    border: '1px solid #222',

    display: 'flex',
    flexDirection:
      isMobile
        ? 'row'
        : 'column',

    alignItems:
      isMobile
        ? 'center'
        : 'flex-start',

    gap: isMobile ? 14 : 18,

    minHeight:
      isMobile
        ? 'unset'
        : 240
  }} onMouseEnter={(e) => {
    if (isMobile) return

    e.currentTarget.style.transform = 'translateY(-4px)'
    e.currentTarget.style.borderColor = '#5CB130'
    e.currentTarget.style.boxShadow = '0 0 18px rgba(92,177,48,0.25)'
  }}

  onMouseLeave={(e) => {
    if (isMobile) return

    e.currentTarget.style.transform = 'translateY(0px)'
    e.currentTarget.style.borderColor = '#222'
    e.currentTarget.style.boxShadow = 'none'
  }}>

    <div style={{
      fontSize: isMobile ? 28 : 42,
      flexShrink: 0
    }}>
      🎯
    </div>

    <div>

      <div style={{
        color: '#777',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8
      }}>
        Passo 3
      </div>

      <div style={{
        color: '#fff',
        fontWeight: 700,
        fontSize: isMobile ? 18 : 28,
        lineHeight: 1.1
      }}>
        Chegada ao destino
      </div>

      <div style={{
        color: '#5CB130',
        marginTop: 8,
        fontWeight: 600,
        fontSize: isMobile ? 13 : 16,
        lineHeight: 1.3
      }}>
        {result.originalPlace || result.destination.name}
      </div>

    </div>
  </div>

</div>

{/* RESUMEN */}
<div style={{
  marginTop: 18,
  background: '#141414',
  borderRadius: 10,
  padding: isMobile ? 12 : 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10
}}>

  <div style={{
    color: '#5CB130',
    fontWeight: 700,
    fontSize: isMobile ? 15 : 16
  }}>
    🎯 Chegas por volta das {(() => {
      const now = new Date()
      now.setMinutes(now.getMinutes() + result.best.totalTime)

      return now.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      })
    })()}
  </div>

  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12
  }}>

    <div style={{
      color: '#5CB130',
      fontWeight: 600,
      fontSize: isMobile ? 13 : 14
    }}>
      🚶 {result.best.walkingToStop} min a pé
    </div>

    <div style={{
      color: '#fff',
      fontWeight: 600,
      fontSize: isMobile ? 13 : 14
    }}>
      🕒 Passa às {result.best.nextBus.time}
    </div>

    <div style={{
      color: '#5CB130',
      fontWeight: 700,
      fontSize: isMobile ? 13 : 14
    }}>
      ⏱️ {result.best.totalTime} min total
    </div>

  </div>
</div>

    {/* HORARIOS */}
    <div
      onClick={() => setShowSchedules(!showSchedules)}
      style={{
        marginTop: 14,
        fontSize: isMobile ? 12 : 13,
        color: '#aaa',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      <span style={{
        transform: showSchedules ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: '0.2s'
      }}>
        ▾
      </span>

      Ver horários desta paragem
    </div>

    {showSchedules && (
      <div style={{
        marginTop: 10,
        background: '#141414',
        padding: 10,
        borderRadius: 10
      }}>
        <div style={{
          color: '#5CB130',
          fontWeight: 600,
          marginBottom: 8,
          fontSize: 13
        }}>
          Linha {result.best.line}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6
        }}>
          {(result.best.stop.schedules || []).map((time: string, i: number) => (
            <div key={i} style={{
              background: '#2a2a2a',
              padding: '5px 8px',
              borderRadius: 6,
              fontSize: 11,
              color: '#fff'
            }}>
              {time}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* BOTON */}
<button
  onClick={() =>
    navigate(`/?lat=${result.best.stop.coordinates.latitude}&lng=${result.best.stop.coordinates.longitude}`)
  }

  onMouseEnter={(e) => {
    if (isMobile) return
    e.currentTarget.style.transform = 'scale(1.02)'
  }}

  onMouseLeave={(e) => {
    if (isMobile) return
    e.currentTarget.style.transform = 'scale(1)'
  }}

  style={{
    marginTop: 16,
    padding: isMobile ? 11 : 12,
    borderRadius: 10,

    background: 'linear-gradient(135deg, #5CB130, #6ddc2f)',

    color: '#fff',
    width: '100%',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontSize: isMobile ? 13 : 14,

    transition: 'all 0.2s ease',
    boxShadow: '0 6px 18px rgba(92,177,48,0.25)',
  }}
>
  🧭 Ver percurso no mapa
</button>
  </div>

  {/* ALTERNATIVAS */}
  {result.alternatives.length > 0 && (
    <div style={{ marginTop: 18 }}>
      <div style={{
        color: '#aaa',
        fontSize: 13,
        marginBottom: 10
      }}>
        🔄 Também podes ir por aqui
      </div>

      {result.alternatives.map((alt: any, i: number) => (
        <div
  key={i}

  onMouseEnter={(e) => {
    if (isMobile) return

    e.currentTarget.style.borderColor = '#5CB130'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }}

  onMouseLeave={(e) => {
    if (isMobile) return

    e.currentTarget.style.borderColor = 'transparent'
    e.currentTarget.style.transform = 'translateY(0px)'
  }}

  style={{
    transition: 'all 0.2s ease',
cursor: 'pointer',
border: '1px solid transparent',

          background: '#141414',
          padding: isMobile ? 10 : 14,
          borderRadius: 10,
          marginTop: 10,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: isMobile ? 13 : 14
            }}>
              📍 {alt.stop.name}
            </div>

            <div style={{
              marginTop: 8,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: alt.color,
                padding: '3px 7px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700
              }}>
                Linha {alt.line}
              </div>

              <div style={{
                color: '#aaa',
                fontSize: 11
              }}>
                🚶 {alt.walkingToStop} min
              </div>

              <div style={{
                color: '#aaa',
                fontSize: 11
              }}>
                🕒 {alt.nextBus.time} • {alt.waitingTime} min
              </div>

              <div style={{
                color: '#5CB130',
                fontSize: 11,
                fontWeight: 700
              }}>
                ⏱️ {alt.totalTime} min
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              navigate(`/?lat=${alt.stop.coordinates.latitude}&lng=${alt.stop.coordinates.longitude}`)
            }
            style={{
              background: '#5CB130',
              border: 'none',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            Ver
          </button>
        </div>
      ))}
    </div>
  )}
</div>
)}




</div>
</>
)
  
}