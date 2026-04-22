import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import data from '../data/stops.json'
import NearbyStops from './NearbyStops'
import { getDistanceMeters } from '../utils/distance'
import L from 'leaflet'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from './Header'
import LineDrawer from './LineDrawer'
import { getNextBus } from '../utils/time'
import LoadingScreen from './LoadingScreen'
import { addFavorite, removeFavorite, getFavorites } from '../utils/favorites'
import FavoriteStops from './FavoriteStops'
import { requestPermission, scheduleSmartNotification } from '../utils/notifications'
import { requestPushToken } from '../utils/push'
import { doc, setDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'

// 📍 Posición por defecto (Bragança)
const DEFAULT_POSITION: [number, number] = [41.806, -6.756]

const isDay = () => {
  const hour = new Date().getHours()
  return hour >= 7 && hour <= 19
}

function MapClickHandler({ onSelect }: any) {
  useMapEvents({
    contextmenu(e) {
      onSelect(e.latlng)
    },
  })
  return null
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#00d4ff;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,212,255,0.5);"></div>`,
})

const createCustomIcon = (color: string, number?: number, isFav?: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:28px;
      height:28px;
      background:${isFav ? '#FFD700' : color};
      border-radius:50%;
      border:3px solid white;
      font-size:12px;
      font-weight:700;
      color:${isFav ? '#000' : '#fff'};
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
    ">${number ?? ''}</div>`,
  })

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 17)
    }
  }, [position])

  return null
}

// 🔥 COMPONENTE POPUP MEJORADO
function StopPopupContent({ stop, city, favorites, onToggleFavorite, onPlanTrip }: any) {
  const [showAllSchedules, setShowAllSchedules] = useState(false)
  const [selectedLineForSchedule, setSelectedLineForSchedule] = useState<string | null>(null)
  
  // Encontrar TODAS las líneas que pasan por esta parada
  const getLinesForStop = () => {
    const lines: any[] = []
    
    city.lines.forEach((line: any) => {
      const stopInLine = line.stops.find((s: any) => 
        Math.abs(s.coordinates.latitude - stop.coordinates.latitude) < 0.0001 &&
        Math.abs(s.coordinates.longitude - stop.coordinates.longitude) < 0.0001
      )
      
      if (stopInLine) {
        // Encontrar el índice de esta parada en la línea
        const stopIndex = line.stops.findIndex((s: any) => 
          Math.abs(s.coordinates.latitude - stop.coordinates.latitude) < 0.0001 &&
          Math.abs(s.coordinates.longitude - stop.coordinates.longitude) < 0.0001
        )
        
        lines.push({
          line: line.line,
          color: line.color,
          stop: stopInLine,
          allStops: line.stops,
          stopIndex
        })
      }
    })
    
    return lines
  }
  
  const linesForStop = getLinesForStop()
  
  // Obtener próximos buses para cada línea
  const getNextBusesForStop = () => {
    return linesForStop.map(lineInfo => {
      const schedules = lineInfo.stop.schedules || []
      const nextBus = getNextBus(schedules)
      
      return {
        line: lineInfo.line,
        color: lineInfo.color,
        nextBus,
        schedules,
        stopInfo: lineInfo.stop
      }
    }).filter(bus => bus.nextBus)
  }
  
  const nextBuses = getNextBusesForStop()
  
  // Destinos disponibles desde esta parada
  const getAvailableDestinations = () => {
    const destinations: any[] = []
    
    linesForStop.forEach(lineInfo => {
      // Destinos después de esta parada
      const futureStops = lineInfo.allStops.slice(lineInfo.stopIndex + 1)
      
      futureStops.forEach(futureStop => {
        if (!destinations.find(d => d.name === futureStop.name)) {
          destinations.push({
            ...futureStop,
            line: lineInfo.line,
            color: lineInfo.color
          })
        }
      })
    })
    
    return destinations.slice(0, 6)
  }
  
  const destinations = getAvailableDestinations()
  const isFav = favorites.includes(stop.number)
  
  // Obtener todas las líneas como string para el popup
  const allLines = linesForStop.map(l => l.line).join(', ')
  
  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: 12, 
      borderRadius: 12, 
      minWidth: 280,
      maxWidth: 340,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 10,
        borderBottom: '1px solid #333',
        paddingBottom: 8
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
            🚏 {stop.name}
          </div>
          <div style={{ color: '#aaa', fontSize: 10, marginTop: 2 }}>
            Líneas: {allLines}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => onToggleFavorite(stop)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: isFav ? '#FFD700' : '#666',
              padding: '4px 6px',
              borderRadius: 6,
              transition: '0.2s'
            }}
            title={isFav ? 'Remover favoritos' : 'Adicionar favoritos'}
          >
            {isFav ? '★' : '☆'}
          </button>
          
          <button 
            onClick={async () => {
              const ok = await requestPermission()
              if (!ok) return
              // Notificar para todas las líneas
              nextBuses.forEach(bus => {
                scheduleSmartNotification(`${stop.name} - Linha ${bus.line}`, bus.schedules)
              })
            }}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              color: '#5CB130',
              padding: '4px 6px',
              borderRadius: 6
            }}
            title="Notificar quando o ônibus chegar"
          >
            🔔
          </button>
        </div>
      </div>
      
      {/* Próximos buses */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#aaa', fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          🚌 Próximos autocarros
        </div>
        
        {nextBuses.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 12, background: '#0D0D0D', borderRadius: 8 }}>
            Sem horários disponíveis no momento
          </div>
        )}
        
        {nextBuses.map((bus, idx) => (
          <div key={idx} style={{
            background: '#0D0D0D',
            padding: 8,
            borderRadius: 8,
            marginBottom: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: bus.color,
                width: 30,
                height: 30,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                color: '#fff'
              }}>
                {bus.line}
              </div>
              <div>
                <div style={{ color: bus.nextBus.minutes === 0 ? '#5CB130' : '#fff', fontSize: 14, fontWeight: 600 }}>
                  {bus.nextBus.minutes === 0 ? '🟢 A chegar' : `⏱️ ${bus.nextBus.minutes} min`}
                </div>
                {bus.nextBus.time && (
                  <div style={{ color: '#666', fontSize: 10 }}>
                    {bus.nextBus.time}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onPlanTrip(stop.coordinates.latitude, stop.coordinates.longitude)}
              style={{
                background: bus.color,
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              Planear
            </button>
          </div>
        ))}
      </div>
      
      {/* Ver todos los horarios */}
      {nextBuses.length > 0 && (
        <>
          <div 
            onClick={() => setShowAllSchedules(!showAllSchedules)}
            style={{
              fontSize: 11,
              color: '#5CB130',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
              padding: '4px 0'
            }}
          >
            <span style={{
              transform: showAllSchedules ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: '0.2s'
            }}>
              ▾
            </span>
            Ver horários completos
          </div>
          
          {showAllSchedules && (
            <div style={{ marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
              {linesForStop.map((lineInfo, idx) => {
                const schedules = lineInfo.stop.schedules || []
                if (schedules.length === 0) return null
                
                return (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    <div style={{ 
                      background: lineInfo.color, 
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: 6
                    }}>
                      Linha {lineInfo.line}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {schedules.slice(0, 8).map((time: string, i: number) => (
                        <div key={i} style={{
                          background: '#2a2a2a',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          color: '#ddd'
                        }}>
                          {time}
                        </div>
                      ))}
                      {schedules.length > 8 && (
                        <div style={{ color: '#666', fontSize: 10, padding: '4px 8px' }}>
                          +{schedules.length - 8} más
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
      
      {/* Destinos populares */}
      {destinations.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 10 }}>
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🎯 Destinos desde aquí
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {destinations.slice(0, 4).map((dest, idx) => (
              <div key={idx} style={{
                background: '#0D0D0D',
                padding: '6px 10px',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    background: dest.color,
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#fff'
                  }}>
                    {dest.line}
                  </div>
                  <div style={{ color: '#ddd', fontSize: 12 }}>
                    {dest.name}
                  </div>
                </div>
                
                <button
                  onClick={() => onPlanTrip(dest.coordinates.latitude, dest.coordinates.longitude)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${dest.color}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: dest.color,
                    fontSize: 10,
                    cursor: 'pointer'
                  }}
                >
                  Ir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Botón ver detalles */}
      <button
        onClick={() => onPlanTrip(stop.coordinates.latitude, stop.coordinates.longitude)}
        style={{
          marginTop: 12,
          padding: 8,
          borderRadius: 8,
          background: '#5CB130',
          color: '#fff',
          width: '100%',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        🧭 Planear viagem desde aquí
      </button>
    </div>
  )
}

export default function MapView() {
  const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION)
  const [loadingLocation, setLoadingLocation] = useState(true)

  const [selectedStop, setSelectedStop] = useState<[number, number] | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  const navigate = useNavigate()

  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const targetLat = params.get('lat')
  const targetLng = params.get('lng')

  // 📍 Obtener ubicación real
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setLoadingLocation(false)
      },
      () => {
        setLoadingLocation(false)
      }
    )
  }, [])
  
  useEffect(() => {
    if (targetLat && targetLng) {
      setSelectedStop([Number(targetLat), Number(targetLng)])
    }
  }, [targetLat, targetLng])

  useEffect(() => {
    const loadFavs = async () => {
      setFavorites(await getFavorites())
    }
    loadFavs()
  }, [])

  useEffect(() => {
    const saveToken = async () => {
      const token = await requestPushToken()
      const user = auth.currentUser
      if (!token || !user) return

      await setDoc(doc(db, 'users', user.uid), { pushToken: token }, { merge: true })
    }
    saveToken()
  }, [])

  const toggleFavorite = async (stop: any) => {
    if (favorites.includes(stop.number)) {
      await removeFavorite(stop.number)
      setFavorites(favorites.filter((f) => f !== stop.number))
    } else {
      await addFavorite(stop)
      setFavorites([...favorites, stop.number])
    }
  }

  const planTrip = (lat: number, lng: number) => {
    navigate(`/planner?lat=${lat}&lng=${lng}`)
  }

  const city = data.cities.find((c) => c.name === 'Bragança')

  const allStops =
    city?.lines.flatMap((line) =>
      line.stops.map((stop, index) => ({
        ...stop,
        line: line.line,
        color: line.color,
        order: index + 1,
      }))
    ) || []

  const groupedStops: any[] = []

  allStops.forEach((stop) => {
    const existing = groupedStops.find(
      (s) =>
        Math.abs(s.coordinates.latitude - stop.coordinates.latitude) < 0.0001 &&
        Math.abs(s.coordinates.longitude - stop.coordinates.longitude) < 0.0001
    )

    if (existing) {
      existing.lines.push({
        line: stop.line,
        color: stop.color,
        order: stop.order,
        schedules: (stop as any).schedules || [],
      })
    } else {
      groupedStops.push({
        ...stop,
        lines: [
          {
            line: stop.line,
            color: stop.color,
            order: stop.order,
            schedules: (stop as any).schedules || [],
          },
        ],
      })
    }
  })

  const filteredStops = selectedLine
    ? groupedStops.filter((s) =>
        s.lines.some((l: any) => l.line === selectedLine)
      )
    : groupedStops

  const nearbyStops = filteredStops
    .map((stop) => {
      const distance = getDistanceMeters(
        position[0],
        position[1],
        stop.coordinates.latitude,
        stop.coordinates.longitude
      )

      const nextTimes = stop.lines
        .map((l: any) => {
          const next = getNextBus(l.schedules || [])
          return next ? next.minutes : null
        })
        .filter((n: number | null): n is number => n !== null)

      const next = nextTimes.length > 0 ? Math.min(...nextTimes) : null

      return { ...stop, distance, next }
    })
    .filter((s) => s.distance <= 500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)

  const bestStop = nearbyStops
    .filter((s) => s.next !== null)
    .sort((a, b) => (a.next ?? 999) - (b.next ?? 999))[0]

  return (
    <>
      <Header />

      {loadingLocation && <LoadingScreen />}

      <button
        onClick={() => navigate('/planner')}
        style={{
          position: 'fixed',
          bottom: 350,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 30,
          background: '#5CB130',
          color: '#fff',
          border: 'none',
          fontWeight: '600',
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer'
        }}
      >
        ↗️ Planear
      </button>

      <FavoriteStops
        stops={groupedStops.filter((s) => favorites.includes(s.number))}
        onSelect={(stop: any) =>
          setSelectedStop([
            stop.coordinates.latitude,
            stop.coordinates.longitude,
          ])
        }
      />

      <LineDrawer
        lines={city?.lines.map((l) => ({ line: l.line, color: l.color })) || []}
        selected={selectedLine}
        onSelect={(line: string) =>
          setSelectedLine(line === selectedLine ? null : line)
        }
      />

      <MapContainer center={position} zoom={17} style={{ height: '100vh' }}>
        <MapClickHandler
          onSelect={(latlng: any) =>
            navigate(`/planner?lat=${latlng.lat}&lng=${latlng.lng}`)
          }
        />

        <TileLayer
          url={
            isDay()
              ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        <FlyTo position={selectedStop} />

        <Marker position={position} icon={userIcon} />

        {filteredStops.map((stop, i) => {
          const mainLine = stop.lines[0]
          const isFav = favorites.includes(stop.number)

          return (
            <Marker
              key={i}
              position={[stop.coordinates.latitude, stop.coordinates.longitude]}
              icon={createCustomIcon(mainLine.color, mainLine.order, isFav)}
            >
              <Popup minWidth={300} maxWidth={360}>
                <StopPopupContent
                  stop={stop}
                  city={city}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onPlanTrip={planTrip}
                />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <NearbyStops
        stops={nearbyStops}
        bestStop={bestStop}
        onSelect={(stop: any) =>
          setSelectedStop([
            stop.coordinates.latitude,
            stop.coordinates.longitude,
          ])
        }
      />
    </>
  )
}