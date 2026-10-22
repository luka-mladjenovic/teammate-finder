import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` → dist-single/index.html: one self-contained file (JS, CSS and fonts inlined)
// that opens by double-click, for the in-class demo. It uses hash routes (#/find) so file:// works.
export default defineConfig(({ mode }) => {
  const single = mode === 'singlefile'
  return {
    plugins: single ? [react(), viteSingleFile()] : [react()],
    base: single ? './' : '/',
    build: single ? { outDir: 'dist-single', emptyOutDir: true } : undefined,
  }
})
