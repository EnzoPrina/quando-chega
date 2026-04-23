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

function MapClickHandler({ onSelect }: { onSelect: (latlng: L.LatLng) => void }) {
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

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 17)
    }
  }, [position])

  return null
}

// 🔥 COMPONENTE POPUP MEJORADO Y RESPONSIVO
function StopPopupContent({ stop, city, favorites, onToggleFavorite, onPlanTrip, isMobile }: any) {
  const [showAllSchedules, setShowAllSchedules] = useState(false)
  
  const getLinesForStop = () => {
    const lines: any[] = []
    
    city.lines.forEach((line: any) => {
      const stopInLine = line.stops.find((s: any) => 
        Math.abs(s.coordinates.latitude - stop.coordinates.latitude) < 0.0001 &&
        Math.abs(s.coordinates.longitude - stop.coordinates.longitude) < 0.0001
      )
      
      if (stopInLine) {
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
    }).filter((bus): bus is { line: string; color: string; nextBus: NonNullable<ReturnType<typeof getNextBus>>; schedules: any[]; stopInfo: any } => bus.nextBus !== null)
  }
  
  const nextBuses = getNextBusesForStop()
  
  const getAvailableDestinations = () => {
    const destinations: any[] = []
    
    linesForStop.forEach(lineInfo => {
      const futureStops = lineInfo.allStops.slice(lineInfo.stopIndex + 1)
      
      futureStops.forEach((futureStop: any) => {
        if (!destinations.find(d => d.name === futureStop.name)) {
          destinations.push({
            ...futureStop,
            line: lineInfo.line,
            color: lineInfo.color
          })
        }
      })
    })
    
    return destinations.slice(0, isMobile ? 3 : 6)
  }
  
  const destinations = getAvailableDestinations()
  const isFav = favorites.includes(stop.number)
  const allLines = linesForStop.map(l => l.line).join(', ')
  
  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: isMobile ? 10 : 12, 
      borderRadius: 12, 
      minWidth: isMobile ? 240 : 280,
      maxWidth: isMobile ? 300 : 340,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 10,
        borderBottom: '1px solid #333',
        paddingBottom: 8
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>
            🚏 {stop.name}
          </div>
          <div style={{ color: '#aaa', fontSize: 9, marginTop: 2 }}>
            Líneas: {allLines}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => onToggleFavorite(stop)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: isMobile ? 18 : 20,
              cursor: 'pointer',
              color: isFav ? '#FFD700' : '#666',
              padding: isMobile ? '6px 8px' : '4px 6px',
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
              nextBuses.forEach(bus => {
                scheduleSmartNotification(`${stop.name} - Linha ${bus.line}`, bus.schedules)
              })
            }}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: isMobile ? 18 : 16,
              cursor: 'pointer',
              color: '#5CB130',
              padding: isMobile ? '6px 8px' : '4px 6px',
              borderRadius: 6
            }}
            title="Notificar quando o ônibus chegar"
          >
            🔔
          </button>
        </div>
      </div>
      
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
            padding: isMobile ? 6 : 8,
            borderRadius: 8,
            marginBottom: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <div style={{
                background: bus.color,
                width: isMobile ? 28 : 30,
                height: isMobile ? 28 : 30,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: isMobile ? 10 : 12,
                color: '#fff'
              }}>
                {bus.line}
              </div>
              <div>
                <div style={{ color: bus.nextBus.minutes === 0 ? '#5CB130' : '#fff', fontSize: isMobile ? 12 : 14, fontWeight: 600 }}>
                  {bus.nextBus.minutes === 0 ? '🟢 A chegar' : `⏱️ ${bus.nextBus.minutes} min`}
                </div>
                {bus.nextBus.time && (
                  <div style={{ color: '#666', fontSize: 9 }}>
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
                padding: isMobile ? '6px 12px' : '6px 12px',
                color: '#fff',
                fontSize: isMobile ? 10 : 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: '0.2s',
                minWidth: isMobile ? 60 : 'auto'
              }}
            >
              Planear
            </button>
          </div>
        ))}
      </div>
      
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
                      {schedules.slice(0, isMobile ? 6 : 8).map((time: string, i: number) => (
                        <div key={i} style={{
                          background: '#2a2a2a',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 9,
                          color: '#ddd'
                        }}>
                          {time}
                        </div>
                      ))}
                      {schedules.length > (isMobile ? 6 : 8) && (
                        <div style={{ color: '#666', fontSize: 10, padding: '4px 8px' }}>
                          +{schedules.length - (isMobile ? 6 : 8)} más
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
      
      {destinations.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 10 }}>
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🎯 Destinos desde aquí
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {destinations.slice(0, isMobile ? 3 : 4).map((dest, idx) => (
              <div key={idx} style={{
                background: '#0D0D0D',
                padding: '6px 10px',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
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
                  <div style={{ color: '#ddd', fontSize: isMobile ? 10 : 12 }}>
                    {dest.name.length > 25 ? dest.name.substring(0, 22) + '...' : dest.name}
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
      
      <button
        onClick={() => onPlanTrip(stop.coordinates.latitude, stop.coordinates.longitude)}
        style={{
          marginTop: 12,
          padding: isMobile ? 10 : 8,
          borderRadius: 8,
          background: '#5CB130',
          color: '#fff',
          width: '100%',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontSize: isMobile ? 13 : 12
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
  const [showLineDrawer, setShowLineDrawer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const targetLat = params.get('lat')
  const targetLng = params.get('lng')

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Icono personalizado responsivo
  const createCustomIcon = (color: string, number?: number, isFav?: boolean) =>
    L.divIcon({
      className: '',
      html: `<div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:${isMobile ? 34 : 28}px;
        height:${isMobile ? 34 : 28}px;
        background:${isFav ? '#FFD700' : color};
        border-radius:50%;
        border:3px solid white;
        font-size:${isMobile ? 14 : 12}px;
        font-weight:700;
        color:${isFav ? '#000' : '#fff'};
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
      ">${number ?? ''}</div>`,
    })

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

  // Ajustar NearbyStops para que no quede tapado
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
    .slice(0, isMobile ? 3 : 5)

  const bestStop = nearbyStops
    .filter((s) => s.next !== null)
    .sort((a, b) => (a.next ?? 999) - (b.next ?? 999))[0]

  return (
    <>
      <Header />

      {loadingLocation && <LoadingScreen />}

      {/* BARRA INFERIOR SIMPLE - Solo 2 botones como la referencia */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 16 : 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(20, 20, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 60,
        padding: '6px',
        zIndex: 2000,
        display: 'flex',
        gap: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
      }}>
        {/* Botón Ver Líneas */}
        <button
          onClick={() => setShowLineDrawer(!showLineDrawer)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: isMobile ? '10px 20px' : '12px 28px',
            borderRadius: 50,
            background: showLineDrawer ? '#5CB130' : 'rgba(255, 255, 255, 0.1)',
            color: '#fff',
            border: 'none',
            fontWeight: '500',
            fontSize: isMobile ? 14 : 15,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: isMobile ? 16 : 18 }}>🚌</span>
          <span>{selectedLine ? `Linha ${selectedLine}` : 'Ver linhas'}</span>
        </button>

        {/* Botón Planear Viaje - Principal */}
        <button
          onClick={() => navigate('/planner')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: isMobile ? '10px 24px' : '12px 32px',
            borderRadius: 50,
            background: '#5CB130',
            color: '#0D0D0D',
            border: 'none',
            fontWeight: '600',
            fontSize: isMobile ? 14 : 15,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(92, 177, 48, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: isMobile ? 16 : 18 }}>✨</span>
          <span>Planear viagem</span>
        </button>
      </div>

      {/* LINE DRAWER - Mejorado con blur */}
      {showLineDrawer && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? 80 : 90,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto',
          minWidth: isMobile ? 280 : 320,
          maxWidth: '90%',
          background: 'rgba(26, 26, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: 16,
          zIndex: 1999,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.2s ease',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Linhas disponíveis</span>
            <button
              onClick={() => setShowLineDrawer(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 20,
                padding: '6px 14px',
                color: '#ccc',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSelectedLine(null)
                setShowLineDrawer(false)
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 40,
                background: !selectedLine ? '#5CB130' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Todas
            </button>
            {city?.lines.map((line) => (
              <button
  key={line.line}
  onClick={() => {
    setSelectedLine(selectedLine === line.line ? null : line.line)
    setShowLineDrawer(false)
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 40,
    background: selectedLine === line.line ? line.color : 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer'
  }}
>
  <span style={{
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: line.color
  }} />
  {line.line}
</button>
            ))}
          </div>
        </div>
      )}

      {/* FavoriteStops oculto por ahora */}
      <div style={{ display: 'none' }}>
        <FavoriteStops
          stops={groupedStops.filter((s) => favorites.includes(s.number))}
          onSelect={(stop: any) =>
            setSelectedStop([
              stop.coordinates.latitude,
              stop.coordinates.longitude,
            ])
          }
        />
      </div>

      <MapContainer 
        center={position} 
        zoom={isMobile ? 16 : 17} 
        style={{ height: '100vh', width: '100%' }}
        zoomControl={!isMobile}
        attributionControl={false}
      >
        <MapClickHandler
          onSelect={(latlng: L.LatLng) =>
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
              <Popup 
                minWidth={isMobile ? 260 : 300} 
                maxWidth={isMobile ? 320 : 360}
                closeButton={true}
                closeOnClick={false}
              >
                <StopPopupContent
                  stop={stop}
                  city={city}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onPlanTrip={planTrip}
                  isMobile={isMobile}
                />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* NearbyStops con bottom ajustado para que no quede tapado */}
      <div style={{
        marginBottom: 300 ,
        position: 'fixed',
        bottom: isMobile ? 110 : 120,
        left: 0,
        right: 0,
        pointerEvents: 'auto',
        zIndex: 1000,
      }}>
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
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        button:hover {
          transform: scale(1.02);
          opacity: 0.95;
        }
      `}</style>
    </>
  )
}