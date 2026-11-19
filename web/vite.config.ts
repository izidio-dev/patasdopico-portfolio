import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Modo "previa": gera um único arquivo HTML com a API simulada embutida (para visualização).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === "previa" ? [viteSingleFile()] : [])],
  build: mode === "previa" ? { outDir: "dist-previa" } : {},
}));
