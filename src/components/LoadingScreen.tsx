import '../styles/loading.css'
import logo from '../assets/onboarding/onBoarding3.png'

export default function LoadingScreen() {
  return (
    <div className="loading-container">
      <img src={logo} alt="QuandoChega" className="loading-logo" />

      <div className="spinner" />

      <p className="loading-text">A obter localização...</p>
    </div>
  )
}