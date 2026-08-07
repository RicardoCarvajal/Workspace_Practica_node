import type { AidlcApi } from '../../electron/preload/index'

declare module '*.png' {
  const src: string
  export default src
}

declare global {
  interface Window {
    aidlcApi: AidlcApi
  }
}

export {}
