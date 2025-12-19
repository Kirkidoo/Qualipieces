/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ORCHESTRA_CLIENT_ID: string
    readonly VITE_ORCHESTRA_CLIENT_SECRET: string
    readonly VITE_ORCHESTRA_BASE_URL: string
    readonly VITE_ORCHESTRA_IDENTITY_URL: string
    readonly VITE_SHOPIFY_STORE_URL: string
    readonly VITE_SHOPIFY_ACCESS_TOKEN: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
