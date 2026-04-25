import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import data from '../data/stops.json'
import places from '../data/places.json'
import { getDistanceMeters } from '../utils/distance'
import L from 'leaflet'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from './Header'
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

// 🔥 Detectar si es fin de semana
const isWeekend = (): boolean => {
  const day = new Date().getDay()
  return day === 0 || day === 6 // Domingo (0) o Sábado (6)
}

// 🔥 Función para formatear tiempo de forma legible
const formatTimeReadable = (minutes: number): string => {
  if (minutes < 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

// Tipografía Poppins
const poppinsStyle = {
  fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

// Inyectar Poppins globalmente
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  * {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
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
  .leaflet-popup {
    bottom: 20px !important;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 16px !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .leaflet-popup-tip {
    display: none !important;
  }
  .leaflet-popup-close-button {
    top: 12px !important;
    right: 12px !important;
    font-size: 20px !important;
    color: #fff !important;
    background: rgba(0,0,0,0.5) !important;
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 10 !important;
  }
  .leaflet-popup-close-button:hover {
    background: rgba(0,0,0,0.7) !important;
  }
`
document.head.appendChild(styleSheet)

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

function PopupHandler({ position, isMobile }: { position: [number, number] | null; isMobile: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (position && isMobile) {
      setTimeout(() => {
        map.setView(position, map.getZoom(), {
          animate: true,
          duration: 0.3
        })
      }, 50)
    }
  }, [position, map, isMobile])

  return null
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 17)
    }
  }, [position])

  return null
}

// 🔥 COMPONENTE POPUP PARA LUGARES (Pingo Doce, Hospital, etc.)
function PlacePopupContent({ place, onPlanTrip, isMobile }: any) {
  const getPlaceIcon = () => {
    const name = place.name.toLowerCase()
    if (name.includes('pingo') || name.includes('continente') || name.includes('lidl') || name.includes('minipreço') || name.includes('intermarché')) {
      return '🛒'
    }
    if (name.includes('hospital') || name.includes('centro de saúde')) {
      return '🏥'
    }
    if (name.includes('parque')) {
      return '🌳'
    }
    if (name.includes('castelo')) {
      return '🏰'
    }
    if (name.includes('politécnico') || name.includes('escola')) {
      return '🎓'
    }
    if (name.includes('estádio')) {
      return '⚽'
    }
    if (name.includes('câmara') || name.includes('municipal')) {
      return '🏛️'
    }
    if (name.includes('shopping')) {
      return '🛍️'
    }
    if (name.includes('arte') || name.includes('igreja') || name.includes('catedral')) {
      return '🎨'
    }
    if (name.includes('cantina')) {
      return '🍽️'
    }
    return '📍'
  }

  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: isMobile ? 12 : 14, 
      borderRadius: 16, 
      minWidth: isMobile ? 220 : 260,
      maxWidth: isMobile ? 280 : 320,
      ...poppinsStyle,
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10,
        marginBottom: 12,
        borderBottom: '1px solid #333',
        paddingBottom: 8
      }}>
        <span style={{ fontSize: 28 }}>{getPlaceIcon()}</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>
            {place.name}
          </div>
          <div style={{ color: '#FF9800', fontSize: 10, marginTop: 2 }}>
            Ponto de interesse
          </div>
        </div>
      </div>
      
      <p style={{ color: '#aaa', fontSize: 12, marginBottom: 12, lineHeight: 1.4 }}>
        Clique abaixo para planear uma viagem até este local.
      </p>
      
      <button
        onClick={() => onPlanTrip(place.coordinates.latitude, place.coordinates.longitude)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: isMobile ? 10 : 8,
          borderRadius: 10,
          background: '#FF9800',
          color: '#fff',
          width: '100%',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontSize: isMobile ? 13 : 12,
          ...poppinsStyle
        }}
      >
        ✨ Planear viagem até aqui
      </button>
    </div>
  )
}

// 🔥 COMPONENTE POPUP PARA PARADAS (CON SOPORTE PARA FIN DE SEMANA)
function StopPopupContent({ stop, city, favorites, onToggleFavorite, onPlanTrip, isMobile }: any) {
  const [showAllSchedules, setShowAllSchedules] = useState(false)
  const weekend = isWeekend()
  
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
    // Si es fin de semana, no mostrar horarios
    if (weekend) return []
    
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
  
  // Nombre del día en portugués
  const getDayName = () => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return days[new Date().getDay()]
  }
  
  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: isMobile ? 14 : 12, 
      borderRadius: 16, 
      minWidth: isMobile ? 280 : 300,
      maxWidth: isMobile ? 340 : 380,
      ...poppinsStyle,
      position: 'relative',
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
          <div style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>
            🚏 {stop.name}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {linesForStop.map((line, idx) => (
              <span
                key={idx}
                style={{
                  background: line.color,
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {line.line}
              </span>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => onToggleFavorite(stop)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: isMobile ? 20 : 20,
              cursor: 'pointer',
              color: isFav ? '#FFD700' : '#666',
              padding: isMobile ? '8px' : '4px 6px',
              borderRadius: 6,
              transition: '0.2s'
            }}
            title={isFav ? 'Remover favoritos' : 'Adicionar favoritos'}
          >
            {isFav ? '★' : '☆'}
          </button>
          
          <button 
            onClick={async () => {
              if (weekend) {
                alert('🚌 Não há serviço de autocarros aos fins de semana. Volte durante a semana!')
                return
              }
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
              color: weekend ? '#666' : '#5CB130',
              padding: isMobile ? '8px' : '4px 6px',
              borderRadius: 6
            }}
            title={weekend ? "Notificações indisponíveis ao fim de semana" : "Notificar quando o ônibus chegar"}
          >
            🔔
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#aaa', fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          🚌 Próximos autocarros
        </div>
        
        {weekend ? (
          <div style={{ 
            background: 'rgba(255, 100, 100, 0.1)', 
            padding: 16, 
            borderRadius: 12,
            textAlign: 'center',
            border: '1px solid rgba(255, 100, 100, 0.3)'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚫</div>
            <div style={{ color: '#ff8888', fontWeight: 600, marginBottom: 4 }}>
              Sem serviço aos fins de semana
            </div>
            <div style={{ color: '#aaa', fontSize: 11 }}>
              Hoje é {getDayName()}. Os autocarros não circulam.
            </div>
            <div style={{ 
              marginTop: 12, 
              paddingTop: 8, 
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: 11,
              color: '#888'
            }}>
              💡 Volte durante a semana (segunda a sexta)
            </div>
          </div>
        ) : nextBuses.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 12, background: '#0D0D0D', borderRadius: 8 }}>
            Sem horários disponíveis no momento
          </div>
        )}
        
        {!weekend && nextBuses.map((bus, idx) => (
          <div key={idx} style={{
            background: '#0D0D0D',
            padding: isMobile ? 8 : 8,
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
                width: isMobile ? 32 : 30,
                height: isMobile ? 32 : 30,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: isMobile ? 11 : 12,
                color: '#fff'
              }}>
                {bus.line}
              </div>
              <div>
                <div style={{ color: bus.nextBus.minutes === 0 ? '#5CB130' : '#fff', fontSize: isMobile ? 13 : 14, fontWeight: 600 }}>
                  {bus.nextBus.minutes === 0 ? '🟢 A chegar' : `⏱️ ${formatTimeReadable(bus.nextBus.minutes)}`}
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
                borderRadius: 8,
                padding: isMobile ? '8px 14px' : '6px 12px',
                color: '#fff',
                fontSize: isMobile ? 11 : 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: '0.2s',
                minWidth: isMobile ? 70 : 'auto'
              }}
            >
              Planear
            </button>
          </div>
        ))}
      </div>
      
      {!weekend && nextBuses.length > 0 && (
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
      
      {!weekend && destinations.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 10 }}>
          <div style={{ color: '#aaa', fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🎯 Destinos desde aquí
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {destinations.slice(0, isMobile ? 3 : 4).map((dest, idx) => (
              <div key={idx} style={{
                background: '#0D0D0D',
                padding: '8px 10px',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{
                    background: dest.color,
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#fff'
                  }}>
                    {dest.line}
                  </div>
                  <div style={{ color: '#ddd', fontSize: isMobile ? 11 : 12 }}>
                    {dest.name.length > 25 ? dest.name.substring(0, 22) + '...' : dest.name}
                  </div>
                </div>
                
                <button
                  onClick={() => onPlanTrip(dest.coordinates.latitude, dest.coordinates.longitude)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${dest.color}`,
                    borderRadius: 6,
                    padding: '6px 12px',
                    color: dest.color,
                    fontSize: 11,
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
        onClick={() => {
          if (weekend) {
            alert('🚌 Não há serviço de autocarros aos fins de semana. Planeie outro meio de transporte!')
          } else {
            onPlanTrip(stop.coordinates.latitude, stop.coordinates.longitude)
          }
        }}
        style={{
          marginTop: 12,
          padding: isMobile ? 12 : 10,
          borderRadius: 10,
          background: weekend ? '#666' : '#5CB130',
          color: '#fff',
          width: '100%',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontSize: isMobile ? 14 : 13,
          ...poppinsStyle
        }}
      >
        {weekend ? '🚫 Sem serviço ao fim de semana' : '🧭 Planear viagem desde aquí'}
      </button>
    </div>
  )
}

export default function MapView() {
  const [position, setPosition] = useState<[number, number]>(DEFAULT_POSITION)
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [selectedStop, setSelectedStop] = useState<[number, number] | null>(null)
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showLineDrawer, setShowLineDrawer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const targetLat = params.get('lat')
  const targetLng = params.get('lng')

  const weekend = isWeekend()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const createCustomIcon = (color: string, number?: number, isFav?: boolean) =>
    L.divIcon({
      className: '',
      html: `<div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:${isMobile ? 38 : 28}px;
        height:${isMobile ? 38 : 28}px;
        background:${isFav ? '#FFD700' : color};
        border-radius:50%;
        border:3px solid white;
        font-size:${isMobile ? 15 : 12}px;
        font-weight:700;
        color:${isFav ? '#000' : '#fff'};
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
      ">${number ?? ''}</div>`,
    })

  const createPlaceIcon = () =>
    L.divIcon({
      className: '',
      html: `<div style="
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius: 8px;
        width:${isMobile ? 34 : 28}px;
        height:${isMobile ? 34 : 28}px;
        background: #fcfcfcc9;
        backdropFilter: blur(5px);
        border: 2px solid white;
        font-size:${isMobile ? 14 : 12}px;
        font-weight:700;
        color: #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.2);
      ">📍</div>`,
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

  // 🔥 Si es fin de semana, no mostrar horarios en las paradas cercanas
  const nearbyStops = filteredStops
    .map((stop) => {
      const distance = getDistanceMeters(
        position[0],
        position[1],
        stop.coordinates.latitude,
        stop.coordinates.longitude
      )

      const allNextBuses: { line: string; color: string; minutes: number }[] = []
      
      // Solo calcular horarios si NO es fin de semana
      if (!weekend) {
        stop.lines.forEach((line: any) => {
          const schedules = line.schedules || []
          const nextBus = getNextBus(schedules)
          if (nextBus) {
            allNextBuses.push({
              line: line.line,
              color: line.color,
              minutes: nextBus.minutes
            })
          }
        })
        allNextBuses.sort((a, b) => a.minutes - b.minutes)
      }

      return { 
        ...stop, 
        distance, 
        allBuses: allNextBuses,
        isWeekend: weekend
      }
    })
    .filter((s) => s.distance <= 500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, isMobile ? 3 : 5)

  // Nombre del día
  const getDayName = () => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return days[new Date().getDay()]
  }

  return (
    <>
      <Header />

      {loadingLocation && <LoadingScreen />}

      {/* 🔥 BANNER DE FIN DE SEMANA (opcional, visible pero no molesto) */}
      {weekend && (
        <div style={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 100, 100, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '8px 16px',
          borderRadius: 40,
          zIndex: 2001,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 14 }}>🚫</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>
            Sem serviço de autocarros ao fim de semana
          </span>
        </div>
      )}

      {/* BARRA INFERIOR */}
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
            ...poppinsStyle,
          }}
        >
          <span style={{ fontSize: isMobile ? 16 : 18 }}>🚌</span>
          <span>{selectedLine ? `Linha ${selectedLine}` : 'Ver linhas'}</span>
        </button>

        <button
          onClick={() => navigate('/planner')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: isMobile ? '10px 24px' : '12px 32px',
            borderRadius: 50,
            background: '#fff',
            color: '#1a1a1a',
            border: 'none',
            fontWeight: '600',
            fontSize: isMobile ? 14 : 15,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            whiteSpace: 'nowrap',
            ...poppinsStyle,
          }}
        >
          <span style={{ fontSize: isMobile ? 16 : 18 }}>✨</span>
          <span>Planear viagem</span>
        </button>
      </div>

      {/* LINE DRAWER */}
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
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, ...poppinsStyle }}>Linhas disponíveis</span>
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
                ...poppinsStyle,
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
                ...poppinsStyle,
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
                  cursor: 'pointer',
                  ...poppinsStyle,
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
        zoom={isMobile ? 15 : 17} 
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
        <PopupHandler position={popupPosition} isMobile={isMobile} />

        <Marker position={position} icon={userIcon} />

        {/* MARKERS DE PARADAS */}
        {filteredStops.map((stop, i) => {
          const mainLine = stop.lines[0]
          const isFav = favorites.includes(stop.number)

          return (
            <Marker
              key={i}
              position={[stop.coordinates.latitude, stop.coordinates.longitude]}
              icon={createCustomIcon(mainLine.color, mainLine.order, isFav)}
              eventHandlers={{
                click: () => {
                  setPopupPosition([stop.coordinates.latitude, stop.coordinates.longitude])
                  setTimeout(() => setPopupPosition(null), 500)
                }
              }}
            >
              <Popup 
                minWidth={isMobile ? 280 : 300} 
                maxWidth={isMobile ? 350 : 360}
                closeButton={true}
                closeOnClick={false}
                autoPan={true}
                autoPanPadding={L.point(20, 80)}
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

        {/* MARKERS DE LUGARES */}
        {places.map((place, idx) => (
          <Marker
            key={`place-${idx}`}
            position={[place.coordinates.latitude, place.coordinates.longitude]}
            icon={createPlaceIcon()}
            eventHandlers={{
              click: () => {
                setPopupPosition([place.coordinates.latitude, place.coordinates.longitude])
                setTimeout(() => setPopupPosition(null), 500)
              }
            }}
          >
            <Popup 
              minWidth={isMobile ? 240 : 260} 
              maxWidth={isMobile ? 300 : 320}
              closeButton={true}
              closeOnClick={false}
              autoPan={true}
              autoPanPadding={L.point(20, 80)}
            >
              <PlacePopupContent
                place={place}
                onPlanTrip={planTrip}
                isMobile={isMobile}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* NearbyStops con información de fin de semana */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 85 : 95,
        left: 0,
        right: 0,
        zIndex: 1000,
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingBottom: 8,
      }}>
        <div style={{
          display: 'flex',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 16,
        }}>
          {nearbyStops.map((stop, idx) => {
            const isFav = favorites.includes(stop.number)
            return (
              <div
                key={idx}
                onClick={() =>
                  setSelectedStop([
                    stop.coordinates.latitude,
                    stop.coordinates.longitude,
                  ])
                }
                style={{
                  minWidth: isMobile ? 240 : 280,
                  background: '#1a1a1a',
                  borderRadius: 16,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  ...poppinsStyle,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                    {stop.lines.map((line: any, lineIdx: number) => (
                      <div
                        key={lineIdx}
                        style={{
                          background: line.color,
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#fff'
                        }}
                      >
                        {line.line}
                      </div>
                    ))}
                  </div>
                  {isFav && <span style={{ color: '#FFD700', fontSize: 16 }}>★</span>}
                </div>
                
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {stop.name.length > 25 ? stop.name.substring(0, 22) + '...' : stop.name}
                </div>
                
                <div style={{ color: '#aaa', fontSize: 11, marginBottom: 8 }}>
                  🚶 {Math.round(stop.distance)}m
                </div>
                
                {weekend ? (
                  <div style={{
                    background: 'rgba(255, 100, 100, 0.1)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    border: '1px solid rgba(255, 100, 100, 0.2)'
                  }}>
                    <span style={{ color: '#ff8888', fontSize: 11, fontWeight: 500 }}>
                      🚫 Sem serviço ao fim de semana
                    </span>
                  </div>
                ) : stop.allBuses && stop.allBuses.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {stop.allBuses.slice(0, 2).map((bus: any, busIdx: number) => (
                      <div
                        key={busIdx}
                        style={{
                          background: 'rgba(92,177,48,0.15)',
                          padding: '4px 8px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <div style={{
                          background: bus.color,
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
                          {bus.line}
                        </div>
                        <span style={{ color: '#5CB130', fontSize: 11, fontWeight: 500 }}>
                          ⏱️ {formatTimeReadable(bus.minutes)}
                        </span>
                      </div>
                    ))}
                    {stop.allBuses.length > 2 && (
                      <div style={{ color: '#666', fontSize: 10, textAlign: 'center', marginTop: 4 }}>
                        +{stop.allBuses.length - 2} mais linhas
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center'
                  }}>
                    <span style={{ color: '#666', fontSize: 11 }}>
                      Sem horários disponíveis
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}