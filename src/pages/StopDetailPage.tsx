import { useParams, useNavigate } from 'react-router-dom'
import data from '../data/stops.json'
import '../styles/stopDetails.css'
import { getNextBus, formatTime } from '../utils/time'

const isWeekend = () => {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export default function StopDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const noService = isWeekend()

  const city = data.cities.find((c) => c.name === 'Bragança')

  let foundStop: any = null
  let linesInfo: any[] = []

  city?.lines.forEach((line) => {
    line.stops.forEach((stop) => {
      if (stop.number === id) {
        foundStop = stop

        linesInfo.push({
          line: line.line,
          color: line.color,
          schedules: (stop as any).schedules || [],
        })
      }
    })
  })

  if (!foundStop) return <p>Paragem não encontrada</p>

  const nextBuses = linesInfo
    .map((l) => {
      const next = getNextBus(l.schedules)
      return next ? { ...l, next } : null
    })
    .filter(Boolean) as any[]

  const globalNext = nextBuses.sort(
    (a, b) => a.next.minutes - b.next.minutes
  )[0]

  return (
    <div className="container">
      <div className="headerWrapper">
        <div className="header">
          <h1 className="stopName">{foundStop.name}</h1>

          {noService && (
            <div style={{
              marginBottom: 10,
              color: '#ff6b6b',
              fontWeight: 600,
              fontSize: 13,
            }}>
              Sem serviço ao fim de semana
            </div>
          )}

          <div className="nextBar" style={{
            borderLeftColor: globalNext?.color || '#4CAF50',
          }}>
            <span className="nextIcon">⏳</span>

            <div>
              <div className="nextTextLabel">Próximo autocarro</div>

              <div>
                {!noService && globalNext ? (
                  <>
                    <span className="nextMinutes">
                      {formatTime(globalNext.next.minutes)}
                    </span>{' '}
                    <span className="nextHour">
                      ({globalNext.next.time})
                    </span>
                  </>
                ) : (
                  <span className="nextTextLabel">
                    Sem mais autocarros hoje
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scrollSection">
        <h3 className="sectionTitle">Linhas que passam aqui</h3>

        <div style={{
          display: 'flex',
          overflowX: 'auto',
          marginBottom: 20
        }}>
          {linesInfo.map((l, i) => (
            <div
              key={i}
              className="lineTagHorizontal"
              style={{ background: l.color }}
            >
              {l.line}
            </div>
          ))}
        </div>

        <h3 className="sectionTitle">Horários</h3>

        {linesInfo.map((l, i) => {
          const next = getNextBus(l.schedules)

          return (
            <div key={i} className="scheduleCard">
              <div className="lineTitle" style={{ color: l.color }}>
                Linha {l.line}
              </div>

              {!noService && next ? (
                <div className="nextInsideLine">
                  Próximo: {next.time} ({formatTime(next.minutes)})
                </div>
              ) : (
                <div className="nextInsideLine">
                  Sem mais autocarros hoje
                </div>
              )}

              <div className="hourRow">
                {l.schedules.map((t: string, idx: number) => (
                  <div key={idx} className="hourChip">
                    <span className="hourText">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 30,
            padding: 14,
            borderRadius: 12,
            border: 'none',
            background: '#5CB130',
            color: '#fff',
            width: '100%',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Voltar ao mapa
        </button>
      </div>
    </div>
  )
}