
<script setup>
import { useI18n } from 'vue-i18n'
import { changeLanguage } from './index.js'

const { locale } = useI18n({ useScope: 'global' })

function setLanguage(language) {
  changeLanguage(language)
}
</script>

<template>
  <div
      class="language-switcher"
      role="group"
      aria-label="Select language / Seleccionar idioma"
  >
    <button
        type="button"
        :class="{ active: locale === 'es' }"
        :aria-pressed="locale === 'es'"
        @click="setLanguage('es')"
    >
      ES
    </button>

    <span class="separator">|</span>

    <button
        type="button"
        :class="{ active: locale === 'en' }"
        :aria-pressed="locale === 'en'"
        @click="setLanguage('en')"
    >
      EN
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 11px;
  border: 1px solid #d7e2de;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 3px 12px rgba(17, 45, 53, 0.08);
}

.language-switcher button {
  padding: 6px 9px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #718482;
  font: 700 12px Arial, sans-serif;
  cursor: pointer;
  transition: 0.2s;
}

.language-switcher button.active {
  background: #087f75;
  color: #ffffff;
}

.language-switcher button:hover:not(.active) {
  background: #edf5f1;
  color: #112d35;
}

.language-switcher button:focus-visible {
  outline: 2px solid #087f75;
  outline-offset: 2px;
}

.separator {
  color: #aab8b5;
  font-size: 12px;
}
</style>
