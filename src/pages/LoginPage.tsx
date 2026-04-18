import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    navigate('/')
  } catch (err) {
    console.error(err)
    setError('Erro ao iniciar com Google')
  }
}

  const validate = () => {
    if (!email.includes('@')) return 'Email inválido'
    if (password.length < 6) return 'Mínimo 6 caracteres'
    return null
  }

  const handleSubmit = async () => {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    try {
      setError('')

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }

      navigate('/')
    } catch (err: any) {
      setError('Credenciais inválidas')
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>QuandoChega</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <div style={{ position: 'relative', width: 220 }}>
        <input
          placeholder="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...styles.input, width: '100%' }}
        />

        <span
          onClick={() => setShowPassword(!showPassword)}
          style={styles.eye}
        >
          👁️
        </span>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={handleSubmit} style={styles.button}>
        {isLogin ? 'Entrar' : 'Criar conta'}
      </button>
      <button onClick={handleGoogleLogin} style={styles.googleButton}>
  Continuar com Google
</button>

      <p onClick={() => setIsLogin(!isLogin)} style={styles.switch}>
        {isLogin
          ? 'Não tens conta? Criar'
          : 'Já tens conta? Entrar'}
      </p>
    </div>
  )
}

const styles: any = {
  container: {
    height: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#fff',
    marginBottom: 20,
    fontWeight: 600,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: 'none',
    width: 220,
    background: '#2a2a2a',
    color: '#fff',
  },
  button: {
    padding: 10,
    borderRadius: 8,
    border: 'none',
    background: '#008829',
    color: '#fff',
    width: 220,
    cursor: 'pointer',
    fontWeight: 500,
  },
  switch: {
    color: '#aaa',
    fontSize: 12,
    cursor: 'pointer',
  },
  eye: {
    position: 'absolute',
    right: 10,
    top: 10,
    cursor: 'pointer',
    fontSize: 14,
  },
  error: {
    color: '#ff6b6b',
    fontSize: 12,
  },
  googleButton: {
  padding: 10,
  borderRadius: 8,
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#fff',
  width: 220,
  cursor: 'pointer',
  fontWeight: 500,
},
}