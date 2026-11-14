import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e',
  timeout:30000,
  use:{baseURL:process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{viewport:{width:1280,height:900}}},{name:'mobile',use:{viewport:{width:375,height:812}}}],
});
