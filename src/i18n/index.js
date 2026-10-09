
import { createI18n } from 'vue-i18n'
import es from './es.js'
import en from './en.js'

const savedLanguage = localStorage.getItem('compucare-language')

const locale = ['es', 'en'].includes(savedLanguage)
    ? savedLanguage
    : 'es'

const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'es',
    messages: {
        es,
        en
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
