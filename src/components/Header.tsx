import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/images/logo2.png'
import { useEffect, useState, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Header() {
  const navigate = useNavigate()
  const user = auth.currentUser

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser
      if (!user) return

      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()
        setUserData(data)

        if (!data.nationality) {
          setShowProfileModal(true)
        }
      }
    }

    loadProfile()
  }, [])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const displayName =
    user?.displayName ||
    userData?.name ||
    user?.email?.split('@')[0] ||
    'Utilizador'

  const getInitials = () => {
    if (!displayName || displayName === 'Utilizador') return 'U'
    const names = displayName.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <>
      {/* HEADER FLOTANTE */}
      <div style={styles.floatingContainer}>
        
        {/* ESPACIO IZQUIERDO (vacío para equilibrar) */}
        <div style={styles.leftPlaceholder} />

        {/* LOGO - CENTRADO */}
        <div style={styles.logoCard}>
          <img src={logo} alt="QuandoChega" style={styles.logo} />
        </div>

        {/* USUARIO - DERECHA */}
        <div style={styles.userCard} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={styles.userAvatar}>
            {getInitials()}
          </div>
        </div>

        {/* MENU DESPLEGABLE */}
        {menuOpen && (
          <div ref={menuRef} style={styles.menu}>
            <div style={styles.menuHeader}>
              <div style={styles.menuAvatar}>
                {getInitials()}
              </div>
              <div style={styles.menuInfo}>
                <div style={styles.menuName}>{displayName}</div>
                <div style={styles.menuEmail}>{user?.email}</div>
              </div>
            </div>

            <div style={styles.menuDivider} />

            <button
              onClick={() => {
                setMenuOpen(false)
                navigate('/complete-profile')
              }}
              style={styles.menuItem}
            >
              <span style={styles.menuIcon}>👤</span>
              Meu perfil
            </button>

{/*             <button
              onClick={() => {
                setMenuOpen(false)
                navigate('/favorites')
              }}
              style={styles.menuItem}
            >
              <span style={styles.menuIcon}>⭐</span>
              Favoritos
            </button> */}

            <div style={styles.menuDivider} />

            <button
              onClick={handleLogout}
              style={{ ...styles.menuItem, ...styles.menuItemLogout }}
            >
              <span style={styles.menuIcon}>🚪</span>
              Sair
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE PERFIL INCOMPLETO */}
      {showProfileModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.modalIcon}>🌍</div>
            <h3 style={modalStyles.title}>Completa o teu perfil</h3>
            <p style={modalStyles.text}>
              Precisamos saber a tua nacionalidade para melhorar a tua experiência.
            </p>
            <div style={modalStyles.modalButtons}>
              <button
                onClick={() => setShowProfileModal(false)}
                style={modalStyles.buttonSecondary}
              >
                Agora não
              </button>
              <button
                onClick={() => navigate('/complete-profile')}
                style={modalStyles.buttonPrimary}
              >
                Completar agora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  floatingContainer: {
    position: 'fixed',
    top: 20,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    zIndex: 2000,
    pointerEvents: 'none',
  },
  leftPlaceholder: {
    width: 48,
    height: 48,
    pointerEvents: 'none',
  },
  logoCard: {
    pointerEvents: 'auto',
    background: 'rgba(77, 77, 77, 0.23)',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(2px)',
    borderRadius: 50,
    padding: '3px 23px',
    boxShadow: '0 5px 12px rgba(0, 0, 0, 0.29)',
    border: '1px solid rgb(255, 255, 255)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  logo: {
    height: 34,
    width: 'auto',
    objectFit: 'contain',
  },
  userCard: {
    pointerEvents: 'auto',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 50,
    padding: '6px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 38,
    background: '#5CB130',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
  },
  menu: {
    position: 'absolute',
    top: 70,
    right: 20,
    width: 270,
    background: 'rgba(26, 26, 30, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 20,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'slideDown 0.2s ease',
    pointerEvents: 'auto',
  },
  menuHeader: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(0, 0, 0, 0.3)',
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 44,
    background: '#5CB130',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 18,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 4,
  },
  menuEmail: {
    color: '#aaa',
    fontSize: 11,
    wordBreak: 'break-all',
  },
  menuDivider: {
    height: 1,
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '8px 0',
  },
  menuItem: {
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.2s',
    textAlign: 'left',
  },
  menuItemLogout: {
    color: '#ff6b6b',
  },
  menuIcon: {
    fontSize: 18,
    width: 24,
  },
}

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  modal: {
    background: '#1a1a1a',
    padding: '24px',
    borderRadius: 20,
    width: '90%',
    maxWidth: 320,
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
  },
  text: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  modalButtons: {
    display: 'flex',
    gap: 12,
  },
  buttonPrimary: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 12,
    border: 'none',
    background: '#5CB130',
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  buttonSecondary: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 12,
    border: '1px solid #444',
    background: 'transparent',
    color: '#fff',
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
  },
}

// Añadir animaciones CSS
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .logo-card:hover, .user-card:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  }

  button:hover {
    opacity: 0.9;
  }
`
document.head.appendChild(styleSheet)