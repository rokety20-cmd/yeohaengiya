import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, push, update, remove } from 'firebase/database'
import { db } from '../firebase'

const vehiclesRef = (tripId) => ref(db, `trips/${tripId}/vehicles`)
const vehicleRef = (tripId, id) => ref(db, `trips/${tripId}/vehicles/${id}`)

export function useVehicles(tripId) {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    const unsub = onValue(vehiclesRef(tripId), (snap) => {
      const val = snap.val()
      const list = val
        ? Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        : []
      setVehicles(list)
      setLoading(false)
    })
    return () => unsub()
  }, [tripId])

  const addVehicle = useCallback((data) => {
    if (!tripId) return
    push(vehiclesRef(tripId), { ...data, createdAt: Date.now() })
  }, [tripId])

  const updateVehicle = useCallback((id, data) => {
    if (!tripId) return
    update(vehicleRef(tripId, id), data)
  }, [tripId])

  const deleteVehicle = useCallback((id) => {
    if (!tripId) return
    remove(vehicleRef(tripId, id))
  }, [tripId])

  return { vehicles, loading, addVehicle, updateVehicle, deleteVehicle }
}
