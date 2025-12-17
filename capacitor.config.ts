import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.appspoilme',
  appName: 'spoil-me-vintage',
  webDir: 'dist',
  server: {
    allowNavigation: [
      "*.paypal.com",
      "*.paypalobjects.com"
    ]
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true
    }
  }
};

export default config;
