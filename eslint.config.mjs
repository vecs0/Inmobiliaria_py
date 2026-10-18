import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "legacy-ui/**", "supabase/functions/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Patrón válido: leer localStorage/estado del navegador tras montar (evita hydration mismatch)
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
