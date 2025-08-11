import React from "react";
import { View, Text } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-churchLight justify-center items-center">
      <Text className="text-churchOrange font-serif text-3xl">Welcome to the Church</Text>
      <Text className="text-churchDark mt-2">A place of worship and peace</Text>
    </View>
  );
}
