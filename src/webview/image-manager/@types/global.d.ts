import type ReactDOM from 'react-dom/client'

declare global {
  interface Window {
    /**
     * react root
     */
    __react_root__: ReactDOM.Root
  }
}

export {}
