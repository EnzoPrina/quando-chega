import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
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
  html: `<div style="width:18px;height:18px;background:#00d4ff;border-radius:50%;border:3px solid white;"></div>`,
})

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

export default function MapView() {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [selectedStop, setSelectedStop] = useState<[number, number] | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  const navigate = useNavigate()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude])
    })
  }, [])

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

  // 🔥 AGRUPAR PARADAS
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

  // 🔥 FILTRO
  const filteredStops = selectedLine
    ? groupedStops.filter((s) =>
        s.lines.some((l: any) => l.line === selectedLine)
      )
    : groupedStops

  // 🔥 NEARBY + TIEMPO (FIX REAL)
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
        .filter((n) => n !== null)

      const next =
        nextTimes.length > 0 ? Math.min(...nextTimes) : null

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

      <button
        onClick={() => navigate('/planner')}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          padding: 14,
          borderRadius: 50,
          background: '#5CB130',
          color: '#fff',
          zIndex: 2000,
        }}
      >
        🧠
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
              <Popup>
                <div style={{ background: '#1a1a1a', padding: 12, borderRadius: 12 }}>
                  <div style={{ color: '#fff' }}>{stop.name}</div>

                  <button onClick={() => toggleFavorite(stop)}>
                    {isFav ? '★' : '☆'}
                  </button>

                  <button onClick={() => navigate(`/stop/${stop.number}`)}>
                    Ver
                  </button>

                  <button onClick={async () => {
                    const ok = await requestPermission()
                    if (!ok) return
                    scheduleSmartNotification(stop.name, stop.lines[0]?.schedules || [])
                  }}>
                    🔔
                  </button>
                </div>
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