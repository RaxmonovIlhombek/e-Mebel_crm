// Alohida fayl — Vite Fast Refresh uchun
// hooks faqat hook export qiladi, component yo'q
import { useContext } from 'react'
import { AppContext } from '@/context/AppContext'

export const useApp = () => useContext(AppContext)