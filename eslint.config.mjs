import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".next/*", ".next-dev/*", "node_modules/*"],
  },
  ...nextConfig,
];

export default eslintConfig;
