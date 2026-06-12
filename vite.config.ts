import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
    // ❌ Supprimé : viteSingleFile() pour permettre le découpage propre des fichiers
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // On s'assure que les chemins d'accès aux assets restent relatifs et propres
  base: "/", 
});