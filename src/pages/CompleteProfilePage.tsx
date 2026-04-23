import { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'  // 🔥 removido updateDoc
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'

export default function CompleteProfilePage() {
  const [nationality, setNationality] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [originalBirthDate, setOriginalBirthDate] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()
  const user = auth.currentUser

  const countries = [
    { value: 'Portugal', label: '🇵🇹 Portugal' },
    { value: 'Brasil', label: '🇧🇷 Brasil' },
    { value: 'Espanha', label: '🇪🇸 Espanha' },
    { value: 'França', label: '🇫🇷 França' },
    { value: 'Angola', label: '🇦🇴 Angola' },
    { value: 'Moçambique', label: '🇲🇿 Moçambique' },
    { value: 'Cabo Verde', label: '🇨🇻 Cabo Verde' },
    { value: 'Argentina', label: '🇦🇷 Argentina' },
    { value: 'Alemanha', label: '🇩🇪 Alemanha' },
    { value: 'Itália', label: '🇮🇹 Itália' },
    { value: 'Reino Unido', label: '🇬🇧 Reino Unido' },
    { value: 'Estados Unidos', label: '🇺🇸 Estados Unidos' },
    { value: 'Canadá', label: '🇨🇦 Canadá' },
    { value: 'Suíça', label: '🇨🇭 Suíça' },
    { value: 'Holanda', label: '🇳🇱 Holanda' },
    { value: 'Bélgica', label: '🇧🇪 Bélgica' },
    { value: 'Luxemburgo', label: '🇱🇺 Luxemburgo' },
    { value: 'Outra', label: '🌍 Outra' },
  ]

  // Calcular edad
  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return null
    const today = new Date()
    const birth = new Date(birthDateStr)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge(birthDate)

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        navigate('/login')
        return
      }

      try {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setName(data.name || user.displayName || '')
          setEmail(data.email || user.email || '')
          setBirthDate(data.birthDate || '')
          setOriginalName(data.name || user.displayName || '')
          setOriginalBirthDate(data.birthDate || '')
          
          if (data.nationality) {
            const found = countries.find(c => c.value === data.nationality)
            if (found) setNationality(found)
          }
        } else {
          setName(user.displayName || '')
          setEmail(user.email || '')
          setOriginalName(user.displayName || '')
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user, navigate])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    try {
      const userRef = doc(db, 'users', user.uid)
      const updateData: any = {
        nationality: nationality?.value || '',
        updatedAt: new Date().toISOString(),
      }

      if (isEditing) {
        if (name !== originalName) updateData.name = name
        if (birthDate !== originalBirthDate) updateData.birthDate = birthDate
      }

      await setDoc(userRef, updateData, { merge: true })
      
      setIsEditing(false)
      setOriginalName(name)
      setOriginalBirthDate(birthDate)
      
      alert('Perfil atualizado com sucesso!')
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar perfil')
    }

    setSaving(false)
  }

  const getInitials = () => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  const getAvatarColor = () => {
    const colors = ['#5CB130', '#FF5722', '#2196F3', '#9C27B0', '#FF9800', '#E91E63']
    const index = (name?.length || 0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
        <p style={styles.loadingText}>A carregar perfil...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Botón voltar */}
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Voltar
        </button>

        {/* Avatar */}
        <div style={styles.avatarContainer}>
          <div
            style={{
              ...styles.avatar,
              background: getAvatarColor(),
            }}
          >
            {getInitials()}
          </div>
          <div style={styles.avatarBadge}>
            {nationality?.label?.split(' ')[0] || '🌍'}
          </div>
        </div>

        <h2 style={styles.title}>Meu Perfil</h2>
        <p style={styles.subtitle}>Gerencie suas informações pessoais</p>

        <div style={styles.form}>
          {/* Nome */}
          <div style={styles.field}>
            <label style={styles.label}>Nome completo</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="Seu nome completo"
              />
            ) : (
              <div style={styles.value}>
                {name || 'Não definido'}
                <button
                  onClick={() => setIsEditing(true)}
                  style={styles.editIcon}
                >
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.value}>{email}</div>
            <div style={styles.emailNote}>
              🔒 O email não pode ser alterado
            </div>
          </div>

          {/* Data de Nascimento */}
          <div style={styles.field}>
            <label style={styles.label}>Data de nascimento</label>
            {isEditing ? (
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={styles.input}
                max={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <div style={styles.value}>
                {birthDate ? (
                  <span>
                    {new Date(birthDate).toLocaleDateString('pt-PT')} 
                    {age && <span style={styles.ageBadge}> ({age} anos)</span>}
                  </span>
                ) : (
                  'Não definido'
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  style={styles.editIcon}
                >
                  ✏️
                </button>
              </div>
            )}
            <div style={styles.emailNote}>
              📊 Usado para estatísticas demográficas anónimas
            </div>
          </div>

          {/* Nacionalidade */}
          <div style={styles.field}>
            <label style={styles.label}>Nacionalidade</label>
            <Select
              options={countries}
              value={nationality}
              onChange={(e) => setNationality(e)}
              placeholder="Selecionar nacionalidade"
              styles={customSelectStyles}
              isDisabled={saving}
            />
          </div>

          {/* Data de registo */}
          <div style={styles.field}>
            <label style={styles.label}>Membro desde</label>
            <div style={styles.value}>
              {user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString('pt-PT')
                : 'Recentemente'}
            </div>
          </div>

          {/* Botões */}
          <div style={styles.buttonGroup}>
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false)
                  setName(originalName)
                  setBirthDate(originalBirthDate)
                }}
                style={styles.buttonSecondary}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              style={isEditing ? styles.buttonPrimary : styles.buttonPrimaryFull}
              disabled={saving}
            >
              {saving ? (
                <span style={styles.buttonLoader} />
              ) : isEditing ? (
                'Salvar alterações'
              ) : (
                'Editar perfil'
              )}
            </button>
          </div>
        </div>

        {/* Nota de privacidade para analytics */}
        <div style={styles.privacyNote}>
          <span style={styles.privacyIcon}>📊</span>
          <span style={styles.privacyText}>
            Os dados demográficos são recolhidos anonimamente para melhorar o serviço e gerar estatísticas para a Câmara Municipal de Bragança.
          </span>
        </div>

        {/* Link para Termos e Privacidade */}
        <div style={styles.footer}>
          <a href="/terms" style={styles.footerLink} target="_blank" rel="noopener noreferrer">
            Termos e Condições
          </a>
          <span style={styles.footerSeparator}>•</span>
          <a href="/privacy" style={styles.footerLink} target="_blank" rel="noopener noreferrer">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  )
}

/* 🎨 estilos base */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    background: '#1a1a1a',
    borderRadius: 24,
    padding: '32px',
    width: '100%',
    maxWidth: 500,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    background: 'transparent',
    border: 'none',
    color: '#5CB130',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
  },
  avatarContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    fontWeight: 600,
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 'calc(50% - 50px)',
    background: '#2a2a2a',
    borderRadius: 20,
    padding: '4px 10px',
    fontSize: 14,
    border: '2px solid #1a1a1a',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  value: {
    color: '#fff',
    fontSize: 15,
    padding: '12px 0',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ageBadge: {
    color: '#5CB130',
    fontSize: 12,
    marginLeft: 8,
  },
  input: {
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #444',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  editIcon: {
    background: 'transparent',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    transition: 'background 0.2s',
  },
  emailNote: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
  },
  buttonPrimary: {
    flex: 1,
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: '#5CB130',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  buttonPrimaryFull: {
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: '#5CB130',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  buttonSecondary: {
    flex: 1,
    padding: '14px',
    borderRadius: 12,
    border: '1px solid #444',
    background: 'transparent',
    color: '#fff',
    fontWeight: 500,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  buttonLoader: {
    display: 'inline-block',
    width: 18,
    height: 18,
    border: '2px solid #fff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  privacyNote: {
    marginTop: 24,
    padding: '12px 16px',
    background: 'rgba(92, 177, 48, 0.1)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid rgba(92, 177, 48, 0.2)',
  },
  privacyIcon: {
    fontSize: 18,
  },
  privacyText: {
    color: '#aaa',
    fontSize: 11,
    lineHeight: 1.4,
    flex: 1,
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid #333',
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
  },
  footerLink: {
    color: '#666',
    fontSize: 12,
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  footerSeparator: {
    color: '#444',
    fontSize: 12,
  },
  loadingContainer: {
    height: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loader: {
    width: 40,
    height: 40,
    border: '3px solid #2a2a2a',
    borderTop: '3px solid #5CB130',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
  },
}

/* 🎨 estilos select dark */
const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#fff',
    borderRadius: 10,
    '&:hover': {
      borderColor: '#5CB130',
    },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    overflow: 'hidden',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#fff',
  }),
  input: (base: any) => ({
    ...base,
    color: '#fff',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#aaa',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? '#3a3a3a' : '#2a2a2a',
    color: '#fff',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#3a3a3a',
    },
  }),
}

// Añadir animación de spin
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  button:hover {
    opacity: 0.9;
  }
  
  .edit-icon:hover {
    background: #2a2a2a;
  }
  
  .footer-link:hover {
    color: #5CB130;
  }
`
document.head.appendChild(styleSheet)