import { useState } from 'react'
import { auth, db } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'

export default function CompleteProfilePage() {
  const [nationality, setNationality] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()

  const user = auth.currentUser

  const countries = [
    { value: 'Portugal', label: '🇵🇹 Portugal' },
    { value: 'Brasil', label: '🇧🇷 Brasil' },
    { value: 'España', label: '🇪🇸 España' },
    { value: 'França', label: '🇫🇷 França' },
    { value: 'Angola', label: '🇦🇴 Angola' },
    { value: 'Argentina', label: '🇦🇷 Argentina' },
    { value: 'Alemanha', label: '🇩🇪 Alemanha' },
    { value: 'Itália', label: '🇮🇹 Itália' },
  ]

  const handleSave = async () => {
    if (!user || !nationality) return

    setSaving(true)

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.displayName || '',
        photo: user.photoURL || '',
        nationality: nationality.value,
        createdAt: new Date(),
      })

      navigate('/') // 🔥 ahora sí funciona sin reload
    } catch (err) {
      console.error(err)
    }

    setSaving(false)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Completar perfil</h2>

      {/* SELECT PRO */}
      <div style={{ width: 240 }}>
        <Select
          options={countries}
          onChange={(e) => setNationality(e)}
          placeholder="Selecionar nacionalidade"
          styles={customSelectStyles}
        />
      </div>

      <button
        onClick={handleSave}
        style={styles.button}
        disabled={saving}
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}

/* 🎨 estilos base */
const styles: any = {
  container: {
    height: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#fff',
    marginBottom: 10,
    fontWeight: 500,
  },
  button: {
    padding: 12,
    borderRadius: 10,
    border: 'none',
    background: '#5CB130',
    color: '#fff',
    width: 240,
    cursor: 'pointer',
    fontWeight: 500,
  },
}

/* 🎨 estilos select dark */
const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: '#1a1a1a',
    border: 'none',
    color: '#fff',
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: '#1a1a1a',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#fff',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? '#2a2a2a' : '#1a1a1a',
    color: '#fff',
    cursor: 'pointer',
  }),
}