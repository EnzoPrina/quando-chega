import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate, Link } from 'react-router-dom'  // 🔥 Importar Link
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Lista de nacionalidades con banderas
const nationalities = [
  { code: 'PT', name: 'Portuguesa', flag: '🇵🇹', emoji: '🇵🇹' },
  { code: 'BR', name: 'Brasileira', flag: '🇧🇷', emoji: '🇧🇷' },
  { code: 'ES', name: 'Espanhola', flag: '🇪🇸', emoji: '🇪🇸' },
  { code: 'FR', name: 'Francesa', flag: '🇫🇷', emoji: '🇫🇷' },
  { code: 'IT', name: 'Italiana', flag: '🇮🇹', emoji: '🇮🇹' },
  { code: 'DE', name: 'Alemã', flag: '🇩🇪', emoji: '🇩🇪' },
  { code: 'UK', name: 'Britânica', flag: '🇬🇧', emoji: '🇬🇧' },
  { code: 'US', name: 'Americana', flag: '🇺🇸', emoji: '🇺🇸' },
  { code: 'CA', name: 'Canadense', flag: '🇨🇦', emoji: '🇨🇦' },
  { code: 'NL', name: 'Holandesa', flag: '🇳🇱', emoji: '🇳🇱' },
  { code: 'BE', name: 'Belga', flag: '🇧🇪', emoji: '🇧🇪' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭', emoji: '🇨🇭' },
  { code: 'AT', name: 'Austríaca', flag: '🇦🇹', emoji: '🇦🇹' },
  { code: 'SE', name: 'Sueca', flag: '🇸🇪', emoji: '🇸🇪' },
  { code: 'NO', name: 'Norueguesa', flag: '🇳🇴', emoji: '🇳🇴' },
  { code: 'DK', name: 'Dinamarquesa', flag: '🇩🇰', emoji: '🇩🇰' },
  { code: 'FI', name: 'Finlandesa', flag: '🇫🇮', emoji: '🇫🇮' },
  { code: 'PL', name: 'Polonesa', flag: '🇵🇱', emoji: '🇵🇱' },
  { code: 'RU', name: 'Russa', flag: '🇷🇺', emoji: '🇷🇺' },
  { code: 'CN', name: 'Chinesa', flag: '🇨🇳', emoji: '🇨🇳' },
  { code: 'JP', name: 'Japonesa', flag: '🇯🇵', emoji: '🇯🇵' },
  { code: 'KR', name: 'Coreana', flag: '🇰🇷', emoji: '🇰🇷' },
  { code: 'IN', name: 'Indiana', flag: '🇮🇳', emoji: '🇮🇳' },
  { code: 'MX', name: 'Mexicana', flag: '🇲🇽', emoji: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', emoji: '🇦🇷' },
  { code: 'CL', name: 'Chilena', flag: '🇨🇱', emoji: '🇨🇱' },
  { code: 'CO', name: 'Colombiana', flag: '🇨🇴', emoji: '🇨🇴' },
  { code: 'PE', name: 'Peruana', flag: '🇵🇪', emoji: '🇵🇪' },
  { code: 'VE', name: 'Venezuelana', flag: '🇻🇪', emoji: '🇻🇪' },
  { code: 'AO', name: 'Angolana', flag: '🇦🇴', emoji: '🇦🇴' },
  { code: 'MZ', name: 'Moçambicana', flag: '🇲🇿', emoji: '🇲🇿' },
  { code: 'CV', name: 'Cabo-verdiana', flag: '🇨🇻', emoji: '🇨🇻' },
  { code: 'ST', name: 'São-tomense', flag: '🇸🇹', emoji: '🇸🇹' },
  { code: 'GW', name: 'Guineense', flag: '🇬🇼', emoji: '🇬🇼' },
  { code: 'TL', name: 'Timorense', flag: '🇹🇱', emoji: '🇹🇱' },
  { code: 'OTHER', name: 'Outra', flag: '🌍', emoji: '🌍' }
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [nationality, setNationality] = useState('PT')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const navigate = useNavigate()

  // Obtener la nacionalidad seleccionada
  const selectedNationality = nationalities.find(n => n.code === nationality)

  // Verificar si ya hay sesión
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/')
      }
    })
    return () => unsubscribe()
  }, [navigate])

  const validate = () => {
    if (!email.includes('@')) return 'Email inválido'
    if (!isLogin) {
      if (name.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres'
      if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres'
      if (password !== confirmPassword) return 'As senhas não coincidem'
    } else {
      if (password.length < 6) return 'Senha inválida'
    }
    return null
  }

  const handleSubmit = async () => {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Actualizar perfil con nombre y nacionalidad
        await updateProfile(userCredential.user, { 
          displayName: name 
        })
        
        // Guardar nacionalidad en Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: name,
          email: email,
          nationality: nationality,
          nationalityName: selectedNationality?.name,
          createdAt: new Date().toISOString()
        }, { merge: true })
      }
      navigate('/')
    } catch (err: any) {
      console.error(err)
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Email inválido')
          break
        case 'auth/user-not-found':
          setError('Usuário não encontrado')
          break
        case 'auth/wrong-password':
          setError('Senha incorreta')
          break
        case 'auth/email-already-in-use':
          setError('Este email já está em uso')
          break
        case 'auth/weak-password':
          setError('Senha muito fraca. Use pelo menos 6 caracteres')
          break
        default:
          setError(isLogin ? 'Falha no login' : 'Falha no cadastro')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName,
        email: result.user.email,
        nationality: 'OTHER',
        nationalityName: 'Outra',
        createdAt: new Date().toISOString()
      }, { merge: true })
      
      navigate('/')
    } catch (err: any) {
      console.error(err)
      setError('Erro ao entrar com Google')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email || !email.includes('@')) {
      setError('Digite um email válido para recuperar a senha')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      setTimeout(() => {
        setShowResetModal(false)
        setResetSent(false)
      }, 3000)
    } catch (err: any) {
      setError('Erro ao enviar email de recuperação')
    } finally {
      setLoading(false)
    }
  }

  const ResetPasswordModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Recuperar senha</h3>
        <p style={styles.modalText}>
          Enviaremos um link para {email || 'seu email'}
        </p>
        <div style={styles.modalButtons}>
          <button onClick={() => setShowResetModal(false)} style={styles.modalButtonCancel}>
            Cancelar
          </button>
          <button onClick={handleResetPassword} style={styles.modalButtonConfirm}>
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
        {resetSent && (
          <p style={styles.resetSent}>✅ Email enviado! Verifique sua caixa de entrada.</p>
        )}
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoWrapper}>
            <img 
              src="/iconlogo.png"
              alt="QuandoChega Logo"
              style={styles.logoImage}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent) {
                  const fallback = document.createElement('div')
                  fallback.style.cssText = `
                    width: 60px;
                    height: 60px;
                    background: #5CB130;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    font-weight: bold;
                    color: white;
                  `
                  fallback.innerText = 'QC'
                  parent.appendChild(fallback)
                }
              }}
            />
          </div>
      {/*     <h2 style={styles.title}>QuandoChega</h2> */}
          <p style={styles.subtitle}>
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </p>
        </div>

        {!isLogin && (
          <>
            <input
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              disabled={loading}
            />

            <div style={styles.selectContainer}>
              <label style={styles.selectLabel}>
                <span style={styles.flagIcon}>{selectedNationality?.flag}</span>
                Nacionalidade
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                {nationalities.map((nat) => (
                  <option key={nat.code} value={nat.code}>
                    {nat.flag} {nat.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          disabled={loading}
          autoComplete="email"
        />

        <div style={{ position: 'relative', width: '100%' }}>
          <input
            placeholder="Senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.input, width: '100%', paddingRight: 40 }}
            disabled={loading}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          <span
            onClick={() => !loading && setShowPassword(!showPassword)}
            style={styles.eye}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        {!isLogin && (
          <input
            placeholder="Confirmar senha"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleSubmit}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? (
            <span style={styles.loader} />
          ) : isLogin ? (
            'Entrar'
          ) : (
            'Criar conta'
          )}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>ou</span>
          <span style={styles.dividerLine} />
        </div>

        <button
          onClick={handleGoogleLogin}
          style={{ ...styles.googleButton, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          <span style={styles.googleIcon}>G</span>
          Continuar com Google
        </button>

        <div style={styles.footer}>
          {isLogin && (
            <button
              onClick={() => setShowResetModal(true)}
              style={styles.forgotLink}
              disabled={loading}
            >
              Esqueceu a senha?
            </button>
          )}

          <p onClick={() => !loading && setIsLogin(!isLogin)} style={styles.switch}>
            {isLogin
              ? 'Não tem conta? Criar conta'
              : 'Já tem conta? Entrar'}
          </p>
        </div>

        {/* 🔥 CORRIGIDO: Usando Link do React Router em vez de <a> */}
        <p style={styles.terms}>
          Ao continuar, você concorda com nossos{' '}
          <Link to="/terms" style={styles.termsLink}>Termos</Link> e{' '}
          <Link to="/privacy" style={styles.termsLink}>Política de Privacidade</Link>
        </p>
      </div>

      {showResetModal && <ResetPasswordModal />}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    background: '#1a1a1a',
    borderRadius: 20,
    padding: '32px 24px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 250,
    height: 250,
    objectFit: 'contain',
    borderRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    margin: 0,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #333',
    width: '100%',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  selectContainer: {
    marginBottom: 12,
  },
  selectLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  flagIcon: {
    fontSize: 16,
  },
  select: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #333',
    width: '100%',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
  },
  button: {
    padding: '12px 16px',
    borderRadius: 10,
    border: 'none',
    background: '#5CB130',
    color: '#fff',
    width: '100%',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 16,
    marginTop: 8,
    transition: 'background 0.2s',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #444',
    background: '#2a2a2a',
    color: '#fff',
    width: '100%',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transition: 'background 0.2s',
  },
  googleIcon: {
    background: '#fff',
    color: '#000',
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  switch: {
    color: '#5CB130',
    fontSize: 13,
    cursor: 'pointer',
    margin: 0,
    transition: 'opacity 0.2s',
  },
  forgotLink: {
    background: 'transparent',
    border: 'none',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 12,
    margin: '8px 0 0 0',
    textAlign: 'center',
  },
  eye: {
    position: 'absolute',
    right: 12,
    top: 10,
    cursor: 'pointer',
    fontSize: 18,
  },
  loader: {
    width: 20,
    height: 20,
    border: '2px solid #fff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 320,
    textAlign: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
  },
  modalText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  modalButtonCancel: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #444',
    background: '#2a2a2a',
    color: '#fff',
    cursor: 'pointer',
  },
  modalButtonConfirm: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#5CB130',
    color: '#fff',
    cursor: 'pointer',
  },
  resetSent: {
    color: '#5CB130',
    fontSize: 12,
    marginTop: 12,
  },
  terms: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 0,
  },
  termsLink: {
    color: '#5CB130',
    textDecoration: 'none',
    cursor: 'pointer',
  },
}

// Añadir keyframes para el loader
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(styleSheet)