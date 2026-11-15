
import { createI18n } from 'vue-i18n'
import es from './es.js'
import en from './en.js'
import screensEs from './screens-es.js'
import screensEn from './screens-en.js'

const savedLanguage = localStorage.getItem('compucare-language')

const locale = ['es', 'en'].includes(savedLanguage)
    ? savedLanguage
    : 'en'

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'en',
    messages: {
        es: { ...es, screens: screensEs },
        en: { ...en, screens: screensEn }
    }
})

export function changeLanguage(language) {
    if (!['es', 'en'].includes(language)) return

    i18n.global.locale.value = language
    localStorage.setItem('compucare-language', language)
    document.documentElement.lang = language
}

document.documentElement.lang = locale

export default i18n
