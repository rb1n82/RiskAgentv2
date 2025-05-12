import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/yahoo-finance': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yahoo-finance/, ''),
        secure: false
      },
      '/api/coingecko': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, ''),
        headers: {
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'x-cg-pro-api-key': process.env.CG_PRO_KEY || ''
        }
      },
      '/data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,      // falls du kein HTTPS lokal hast
        rewrite: path => path, // behält /data/timeseries/… bei
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Definiere die Umgebungsvariablen-Typen
  define: {
    'import.meta.env.VITE_ALPHA_VANTAGE_API_KEY': JSON.stringify(process.env.VITE_ALPHA_VANTAGE_API_KEY),
    'process.env': {},
    global: {},
  }
}));