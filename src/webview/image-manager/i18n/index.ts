import i18next from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { FALLBACK_LANGUAGE } from '~/meta'

let inited = false

export async function initI18n({ lng }: { lng: string }) {
  if (inited)
    return

  await i18next.use(initReactI18next)
    .use(
      resourcesToBackend(async (language: string) => {
        const { default: resources } = await import(`./locales/${language}.json5`)
        return resources
      }),
    )
    .init({
      lng,
      load: 'currentOnly',
      fallbackLng: FALLBACK_LANGUAGE,
      returnNull: false,
      debug: import.meta.env.DEV,
      nsSeparator: '.',
      keySeparator: '.',
      interpolation: {
        escapeValue: false,
      },
    })
  inited = true
}
