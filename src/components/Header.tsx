import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/images/logo2.png'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function Header() {
  const navigate = useNavigate()
  const user = auth.currentUser

  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser
      if (!user) return

      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()

        if (!data.nationality) {
          setShowProfileModal(true)
        }
      }
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const displayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Utilizador'

  return (
    <>
      <div style={styles.container}>
        <div style={styles.left}>
          <img src={logo} style={styles.logoImg} />
        </div>

        <div style={styles.right}>
          {user && (
            <>
              <span style={styles.user}>{displayName}</span>

              <button onClick={handleLogout} style={styles.logout}>
                ⎋
              </button>
            </>
          )}
        </div>
      </div>

      {showProfileModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={modalStyles.title}>
              Completa o teu perfil 🌍
            </h3>

            <p style={modalStyles.text}>
              Precisamos saber de onde és para melhorar a tua experiência.
            </p>

            <button
              onClick={() => navigate('/complete-profile')}
              style={modalStyles.button}
            >
              Completar agora
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const styles: any = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    background: 'rgba(13,13,13,0.7)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 2000,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  logoImg: {
    width: 180,
    height: 38,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  user: {
    color: '#aaa',
    fontSize: 12,
  },
  logout: {
    padding: '3px 10px',
    borderRadius: 6,
    border: 'none',
    background: '#1f1f1f',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 24,
  },
}

const modalStyles: any = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  modal: {
    background: '#121212',
    padding: 20,
    borderRadius: 12,
    width: 260,
    textAlign: 'center',
  },
  title: {
    color: '#fff',
  },
  text: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 15,
  },
  button: {
    background: '#5CB130',
    border: 'none',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    cursor: 'pointer',
  },
}