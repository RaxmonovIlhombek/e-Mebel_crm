import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'

/**
 * Generic hook for GET requests via api.get(path)
 * Returns { data, loading, error, reload }
 */
export function useFetch(path, { enabled = true } = {}) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!path || !enabled) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.get(path)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [path, enabled])

  useEffect(() => { load() }, [load])
  return { data, loading, error, reload: load, setData }
}

/**
 * Hook for list pages — normalises array or {results:[]} response
 * load(queryString) re-fetches with new query
 */
export function useList(apiFn) {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const load = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      // DRF pagination: {count, results:[]} or plain array
      setData(Array.isArray(result) ? result : (result?.results ?? []))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  return { data, loading, error, reload: load, setData }
}