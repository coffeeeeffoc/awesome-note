import { useEffect, useState } from 'react'
import { create } from 'zustand'
import styles from './Toast.module.css'

interface ToastItem {
  id: number
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (message: string) => void
  removeToast: (id: number) => void
}

let _nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message) => {
    const id = _nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2500)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} />
      ))}
    </div>
  )
}

function ToastItem({ item }: { item: ToastItem }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={styles.toast} data-visible={visible ? 'true' : undefined}>
      {item.message}
    </div>
  )
}
