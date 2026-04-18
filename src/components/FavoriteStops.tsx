import './favorites.css'

export default function FavoriteStops({ stops, onSelect }: any) {
  if (!stops.length) return null

  return (
    <div className="favorites-wrapper">
      {stops.map((stop: any, i: number) => (
        <div
          key={i}
          className="favorite-card"
          onClick={() => onSelect(stop)}
        >
          <div className="favorite-star">★</div>

          <div>
            <div className="favorite-name">{stop.name}</div>

            <div className="favorite-lines">
              {stop.lines.map((l: any) => (
                <span
                  key={l.line}
                  className="badge"
                  style={{ background: l.color }}
                >
                  {l.line}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}