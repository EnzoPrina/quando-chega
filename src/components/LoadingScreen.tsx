import { useEffect, useState } from "react";
import '../styles/loading.css'

// 👇 tus imágenes (ajusta rutas)
import img1 from '../assets/onboarding/onBoarding1.png'
import img2 from '../assets/onboarding/onBoarding2.png'
import img3 from '../assets/onboarding/onBoarding3.png'

export default function LoadingScreen() {
  const [step, setStep] = useState(0);

  const slides = [
    {
      image: img1,
      text: "Ativa a tua localização para veres as paragens mais próximas.",
    },
    {
      image: img2,
      text: "Recebe notificações antes da chegada do autocarro.",
    },
    {
      image: img3,
      text: "Disponível atualmente em Bragança. Em breve noutras cidades.",
    },
  ];

  // 🔄 cambia slide cada 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % slides.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">

      {/* 🖼️ SLIDE */}
      <img
        src={slides[step].image}
        alt="slide"
        className="loading-logo"
      />

      {/* 📝 TEXTO */}
      <p className="loading-subtext">
        {slides[step].text}
      </p>

      {/* ⏳ SPINNER */}
      <div className="spinner" />

      <p className="loading-text">A obter localização...</p>

      {/* 🔘 DOTS */}
      <div className="dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === step ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}