import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.sipfresh',
  appName: 'SipFreshNew',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '820872372501-as58mc0l42ucg6mc306jbdkf5t60lvc4.apps.googleusercontent.com',
      androidClientId: '820872372501-as58mc0l42ucg6mc306jbdkf5t60lvc4.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
  webDir: 'dist',
  server: {
    // Allow navigation to PayPal domains for payment processing
    allowNavigation: [
      '*.paypal.com',
      '*.paypalobjects.com',
      'https://www.paypal.com',
      'https://www.sandbox.paypal.com'
    ],
    // Uncomment for live reload during development
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  android: {
    // Android-specific configuration
    buildOptions: {
      keystorePath: undefined, // Set path to keystore for release builds
      keystoreAlias: undefined, // Set keystore alias
    }
  }
};

export default config;
