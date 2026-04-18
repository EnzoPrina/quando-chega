import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import data from '../data/stops.json'
import NearbyStops from './NearbyStops'
import { getDistanceMeters } from '../utils/distance'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
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

// 🔥 fin de semana
const isWeekend = () => {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

// 🔥 icono usuario
const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:18px;height:18px;">
    <div style="position:absolute;width:18px;height:18px;background:#00d4ff;border-radius:50%;border:3px solid white;"></div>
    <div style="position:absolute;width:18px;height:18px;background:#00d4ff;border-radius:50%;opacity:0.4;animation:pulse 1.5s infinite;"></div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    </style>
  </div>`,
})

// 🔥 icono parada
const createCustomIcon = (color: string, number?: number, isFav?: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:24px;
      height:24px;
      background:${isFav ? '#FFD700' : color};
      border-radius:50%;
      border:2px solid white;
      font-size:11px;
      font-weight:600;
      color:${isFav ? '#000' : '#fff'};
      box-shadow:0 0 6px rgba(0,0,0,0.6);
    ">${number ?? ''}</div>`,
  })

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 17, { duration: 1.2 })
    }
  }, [position])

  return null
}

export default function MapView() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [selectedStop, setSelectedStop] = useState<[number, number] | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  const navigate = useNavigate()
  const noService = isWeekend()

  
useEffect(() => {
  const saveToken = async () => {
    try {
      const token = await requestPushToken()
      const user = auth.currentUser

      if (!token || !user) return

      await setDoc(doc(db, 'users', user.uid), {
        pushToken: token,
      }, { merge: true })
    } catch (e) {
      console.log('Push skipped:', e)
    }
  }

  saveToken()
}, [])
  // 📍 ubicación
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      setPosition([latitude, longitude])
    })
  }, [])

  // ⭐ cargar favoritos
  useEffect(() => {
    const loadFavs = async () => {
      const favs = await getFavorites()
      setFavorites(favs)
    }
    loadFavs()
  }, [])

  // ⭐ toggle favorito
  const toggleFavorite = async (stop: any) => {
    const isFav = favorites.includes(stop.number)

    if (isFav) {
      await removeFavorite(stop.number)
      setFavorites(favorites.filter((f) => f !== stop.number))
    } else {
      await addFavorite(stop)
      setFavorites([...favorites, stop.number])
    }
  }

  if (!position) return <LoadingScreen />

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
        schedules: (stop as any).schedules,
      })
    } else {
      groupedStops.push({
        ...stop,
        lines: [
          {
            line: stop.line,
            color: stop.color,
            order: stop.order,
            schedules: stop.schedules,
          },
        ],
      })
    }
  })

  const favoriteStops = groupedStops.filter((stop) =>
    favorites.includes(stop.number)
  )

  const filteredStops = selectedLine
    ? groupedStops.filter((stop) =>
        stop.lines.some((l: any) => l.line === selectedLine)
      )
    : groupedStops

  // 🔥 nearby + tiempo
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
          const next = getNextBus((l as any).schedules|| [])
          return next ? next.minutes : null
        })
        .filter(Boolean)

      const next =
        nextTimes.length > 0 ? Math.min(...nextTimes) : null

      return { ...stop, distance, next }
    })
    .filter((s) => s.distance <= 500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)

const bestStop = nearbyStops
  .filter((s) => s.next !== null)
  .sort((a, b) => (a.next + a.distance / 100) - (b.next + b.distance / 100))[0]

  const uniqueLines =
    city?.lines.map((l) => ({
      line: l.line,
      color: l.color,
    })) || []

  return (
    <>
      <Header />

      {/* TEXTO */}
      <div style={{
        position: 'fixed',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 1000,
        fontSize: 13,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span style={{ color: '#ccc' }}>
          {nearbyStops.length === 0
            ? 'Nenhuma paragem próxima'
            : `${nearbyStops.length} paragens próximas`}
        </span>

        {noService && (
          <span style={{ color: '#ff6b6b', fontWeight: 600 }}>
            Sem serviço
          </span>
        )}
      </div>

      <FavoriteStops
        stops={favoriteStops}
        onSelect={(stop: any) => {
          setSelectedStop([
            stop.coordinates.latitude,
            stop.coordinates.longitude,
          ])
        }}
      />

      <LineDrawer
        lines={uniqueLines}
        selected={selectedLine}
        onSelect={(line: string) =>
          setSelectedLine(line === selectedLine ? null : line)
        }
      />

      <MapContainer center={position} zoom={17} style={{ height: '100vh' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FlyTo position={selectedStop} />

        <Marker position={position} icon={userIcon} />

        {filteredStops.map((stop, i) => {
          const mainLine = stop.lines[0]
          const isFav = favorites.includes(stop.number)

          return (
            <Marker
              key={i}
              position={[
                stop.coordinates.latitude,
                stop.coordinates.longitude,
              ]}
              icon={createCustomIcon(
                mainLine.color,
                mainLine.order,
                isFav
              )}
            >
 <Popup>
  <div style={{
    backdropFilter: 'blur(10px)',
    background: 'rgba(20, 20, 20, 0.8)',
    padding: 12,
    borderRadius: 12,
    minWidth: 180,
  }}>
    
    {/* NOMBRE */}
    <div style={{
      fontWeight: 500,
      fontSize: 14,
      color: '#fff'
    }}>
      {stop.name}
    </div>

    {/* LÍNEAS */}
    <div style={{ marginTop: 8 }}>
      {stop.lines.map((l: any, index: number) => (
        <span
          key={index}
          style={{
            background: l.color,
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            marginRight: 6,
            fontSize: 11,
          }}
        >
          {l.line}
        </span>
      ))}
    </div>

    {/* BOTONES */}
    <div style={{
      marginTop: 12,
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }}>
      
      {/* FAVORITO */}
      <button
        onClick={() => toggleFavorite(stop)}
        style={{
          flex: 1,
          padding: '6px 8px',
          borderRadius: 8,
          border: 'none',
          background: isFav ? '#5CB130' : '#2a2a2a',
          color: isFav ? '#000' : '#fff',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        {isFav ? '★' : '☆'}
      </button>

      {/* DETALLE */}
      <button
        onClick={() => navigate(`/stop/${stop.number}`)}
        style={{
          flex: 2,
          padding: '6px 8px',
          borderRadius: 8,
          border: 'none',
          background: '#5CB130',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        Ver
      </button>

      {/* ALERTA */}
      <button
        onClick={async () => {
          const ok = await requestPermission()
          if (!ok) return

          const schedules = (stop.lines[0] as any)?.schedules|| []
          scheduleSmartNotification(stop.name, schedules)
        }}
        style={{
          flex: 1,
          padding: '6px 8px',
          borderRadius: 8,
          border: 'none',
          background: 'rgba(92,177,48,0.2)',
          color: '#5CB130',
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        🔔
      </button>

    </div>
  </div>
</Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <NearbyStops
        stops={nearbyStops}
        bestStop={bestStop}
        onSelect={(stop: any) => {
          setSelectedStop([
            stop.coordinates.latitude,
            stop.coordinates.longitude,
          ])
        }}
      />
    </>
  )
}