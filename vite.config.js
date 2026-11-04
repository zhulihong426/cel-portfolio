import { defineConfig } from 'vite';

// GitHub Pages 部署时通过 VITE_BASE 指定仓库路径前缀，本地开发默认 '/'
export default defineConfig({
  base: process.env.VITE_BASE || '/',
});
