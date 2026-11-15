import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/** The single file is copied around alone (demo/), with no favicon.svg beside it: inline the icon as a data: URI. */
function inlineFavicon(): Plugin {
  const svg = readFileSync(new URL('./public/favicon.svg', import.meta.url))
  return {
    name: 'inline-favicon',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${svg.toString('base64')}"`),
    },
  }
}

// `npm run build:single` → dist-single/index.html: one self-contained file (JS, CSS, fonts and favicon inlined)
// that opens by double-click, for the in-class demo. It uses hash routes (#/find) so file:// works.
export default defineConfig(({ mode }) => {
  const single = mode === 'singlefile'
  return {
    plugins: single ? [react(), viteSingleFile(), inlineFavicon()] : [react()],
    base: single ? './' : '/',
    build: single ? { outDir: 'dist-single', emptyOutDir: true } : undefined,
  }
})
