declare global {
  interface Window {
    vscodeEnv?: {
      language: string
    }
    currentView?: string
    vscodeTheme?: 'dark' | 'light'
  }
}

export {}
