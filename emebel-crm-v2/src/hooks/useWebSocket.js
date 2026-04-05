import { useEffect, useRef, useCallback } from 'react'

/**
 * Port muammosini hal qilish uchun WS_BASE ni dinamik sozlaymiz.
 * Agar VITE_WS_URL berilmagan bo'lsa, avtomatik backend portiga (8000) yo'naltiramiz.
 */
const getWsUrl = () => {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;

  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  // Agar localhostda bo'lsangiz, portni 8000 ga o'zgartiramiz, aks holda joriy hostni olamiz
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `${window.location.hostname}:8000` 
    : window.location.host;

  return protocol + host;
}

const WS_BASE = getWsUrl();
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

export function useWebSocket({ token, onMessage, enabled = true }) {
  const wsRef = useRef(null)
  const reconnectRef = useRef(0)
  const mountedRef = useRef(true)
  const timerRef = useRef(null)

  const connect = useCallback(() => {
    // Token bo'lmasa yoki o'chirilgan bo'lsa ulanmaymiz
    if (!token || !enabled || !mountedRef.current) return
    // Allaqachon ulangan bo'lsa yoki ulanayotgan bo'lsa kutamiz
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return

    // Django Channels uchun standart yo'lak
    const url = `${WS_BASE}/ws/notifications/?token=${token}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        reconnectRef.current = 0 
        ws.send(JSON.stringify({ action: 'get_list' }))
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (e) {
          // Silently ignore or handle parse errors
        }
      }

      ws.onclose = (event) => {
        if (!mountedRef.current) return
        wsRef.current = null
        
        // 4001 - Token xatosi yoki ruxsat yo'qligi (reconnect qilmaymiz)
        if (event.code !== 1000 && event.code !== 4001) {
          const delay = RECONNECT_DELAYS[
            Math.min(reconnectRef.current, RECONNECT_DELAYS.length - 1)
          ]
          reconnectRef.current++
          timerRef.current = setTimeout(connect, delay)
        }
      }

      ws.onerror = (err) => {
        ws.close()
      }
    } catch (e) {
      // WS Connection Exception
    }
  }, [token, enabled, onMessage])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const disconnect = useCallback(() => {
    clearTimeout(timerRef.current)
    if (wsRef.current) {
      wsRef.current.onclose = null; // Reconnect trigger bo'lmasligi uchun
      wsRef.current.close(1000)
    }
    wsRef.current = null
  }, [])

  useEffect(() => {
    mountedRef.current = true
    if (enabled && token) connect()
    
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000)
      }
    }
  }, [token, enabled, connect])

  return { send, disconnect }
}