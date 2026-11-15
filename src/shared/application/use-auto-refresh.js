import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Refreshes read models while a screen is open and visible.
 * This is polling, not server push; backend authorization remains mandatory.
 */
export function useAutoRefresh(fetcher, intervalMs = 30000) {
  const refreshing = ref(false)
  let timer = null

  async function refresh() {
    if (refreshing.value) return
    refreshing.value = true
    try {
      await fetcher()
    } finally {
      refreshing.value = false
    }
  }

  function refreshIfVisible() {
    if (document.visibilityState === 'visible') refresh().catch(() => {})
  }

  onMounted(() => {
    timer = window.setInterval(refreshIfVisible, intervalMs)
    document.addEventListener('visibilitychange', refreshIfVisible)
  })

  onUnmounted(() => {
    if (timer !== null) window.clearInterval(timer)
    document.removeEventListener('visibilitychange', refreshIfVisible)
  })

  return { refresh, refreshing }
}
