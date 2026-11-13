import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'wave2.spec.mjs',timeout:45000,retries:0,use:{baseURL:'http://localhost:5174',browserName:'chromium',headless:true,trace:'retain-on-failure'}});
