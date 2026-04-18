import { auth, db } from '../firebase'
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore'

// ⭐ agregar favorito
export const addFavorite = async (stop: any) => {
  const user = auth.currentUser
  if (!user) return

  await setDoc(
    doc(db, 'users', user.uid, 'favorites', stop.number),
    {
      name: stop.name,
      createdAt: new Date(),
    }
  )
}

// ❌ eliminar favorito
export const removeFavorite = async (stopId: string) => {
  const user = auth.currentUser
  if (!user) return

  await deleteDoc(doc(db, 'users', user.uid, 'favorites', stopId))
}

// 📥 obtener favoritos
export const getFavorites = async () => {
  const user = auth.currentUser
  if (!user) return []

  const snapshot = await getDocs(
    collection(db, 'users', user.uid, 'favorites')
  )

  return snapshot.docs.map((doc) => doc.id)
}