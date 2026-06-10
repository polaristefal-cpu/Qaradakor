import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  
  // Copy public assets including robots.txt
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/scheduler/')
          ) return 'react-vendor'
          if (id.includes('@radix-ui') || id.includes('@mui') || id.includes('@emotion')) return 'ui-vendor'
          if (id.includes('recharts')) return 'charts'
          if (id.includes('docx') || id.includes('file-saver')) return 'documents'
          if (id.includes('motion') || id.includes('framer-motion')) return 'motion'
          return 'vendor'
        },
      },
    },
  },
})
