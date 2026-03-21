import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "*.csv",
      "*.html",
      "*.txt",
      "*.bat",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
    }
  },
  {
    files: ["receipt print/*.js", "receipt print/*.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    }
  }
];

export default eslintConfig;
