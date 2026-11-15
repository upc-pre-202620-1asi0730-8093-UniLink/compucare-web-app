<script setup>
// Enlace de vuelta a la landing pública, conservando el idioma elegido.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const DEFAULT_LANDING_URL = 'https://upc-pre-202620-1asi0730-8093-unilink.github.io/landing/'

const { t, locale } = useI18n({ useScope: 'global' })

const href = computed(() => {
  const url = new URL(import.meta.env.VITE_LANDING_URL?.trim() || DEFAULT_LANDING_URL)
  url.searchParams.set('lang', locale.value)
  return url.toString()
})
</script>

<template>
  <a class="landing-link" :href="href">
    <i class="pi pi-arrow-left" aria-hidden="true"></i>
    {{ t('auth.backToWebsite') }}
  </a>
</template>

<style scoped>
.landing-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: #c7f1c8;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.landing-link:hover,
.landing-link:focus-visible {
  text-decoration: underline;
}
</style>
