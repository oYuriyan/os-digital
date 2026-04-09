import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5MB
      },
      manifest: {
        name: 'OS Digital Premium',
        short_name: 'OS Digital',
        description: 'Gestão Inteligente de Ordens de Serviço',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'ms.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'ms.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})