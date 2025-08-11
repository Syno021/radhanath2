import React from "react";
import { useTailwind, TailwindProvider } from 'tailwindcss-react-native';
import AppNavigator from "./app/navigation/AppNavigator";

export default function App() {
  return (
    <TailwindProvider>
      <AppNavigator />
    </TailwindProvider>
  );
}
