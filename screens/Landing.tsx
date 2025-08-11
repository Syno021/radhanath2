import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";

type LandingProps = NativeStackScreenProps<RootStackParamList, "Landing"> & {
  setRole: React.Dispatch<React.SetStateAction<"user" | "admin" | null>>;
};

export default function Landing({ navigation, setRole }: LandingProps) {
  return (
    <View className="flex-1 bg-churchLight justify-center items-center">
      <Text className="text-churchOrange font-serif text-3xl mb-6">
        Welcome to Our Church
      </Text>

      <TouchableOpacity
        className="bg-churchOrange px-6 py-3 rounded-full mb-4"
        onPress={() => {
          setRole("user");
          navigation.replace("UserTabs");
        }}
      >
        <Text className="text-white font-bold">Enter as User</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-churchDark px-6 py-3 rounded-full"
        onPress={() => {
          setRole("admin");
          navigation.replace("AdminTabs");
        }}
      >
        <Text className="text-white font-bold">Enter as Admin</Text>
      </TouchableOpacity>
    </View>
  );
}
