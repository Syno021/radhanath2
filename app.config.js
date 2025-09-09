import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "BBT Africa Connect",
  slug: "radharadhanath",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/book1.png",
  scheme: "radharadhanath",
  userInterfaceStyle: "automatic",
  entryPoint: "./App.tsx",
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.bbtafrica.connect",
    adaptiveIcon: {
      foregroundImage: "./assets/images/book1.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: "metro",
    output: "standalone",
    favicon: "./assets/images/book1.png",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        image: "./assets/images/book1.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    },
    eas: {
      projectId: "512d8cbb-60ae-44c6-91fd-081ddb9aaace",
    },
  },
  platforms: ["ios", "android", "web"],
});
