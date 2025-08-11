import React from "react";
import { ScrollView, View, Text, TouchableOpacity, Image } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <ScrollView className="flex-1 bg-churchLight">
      {/* Hero Section */}
      <View className="items-center bg-churchOrange py-10 px-6">
        <Text className="text-3xl font-serif text-white mb-2">Welcome to Our Church</Text>
        <Text className="text-white text-center text-base font-sans">
          Serving communities across South Africa with faith, love, and unity.
        </Text>
      </View>

      {/* About Section */}
      <View className="px-6 py-8">
        <Text className="text-2xl font-serif text-churchDark mb-4">About Us</Text>
        <Text className="text-base font-sans text-gray-700 leading-6">
          Our church is a vibrant community of believers spread across various regions of South Africa. 
          We are dedicated to fostering spiritual growth, supporting our members, and engaging in outreach programs.
        </Text>
      </View>

      {/* Temples Section */}
      <View className="px-6 py-6">
        <Text className="text-2xl font-serif text-churchDark mb-4">Our Temples</Text>
        <View className="space-y-4">
          {[
            { name: "Cape Town Temple", location: "Cape Town, Western Cape" },
            { name: "Johannesburg Temple", location: "Johannesburg, Gauteng" }
          ].map((temple, index) => (
            <View key={index} className="bg-white rounded-2xl shadow p-4 flex-row items-center">
              <Image
                source={{ uri: "https://via.placeholder.com/80" }}
                className="w-20 h-20 rounded-xl mr-4"
              />
              <View className="flex-1">
                <Text className="text-lg font-semibold text-churchDark">{temple.name}</Text>
                <Text className="text-gray-600 text-sm">{temple.location}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Regions Section */}
      <View className="px-6 py-6 bg-churchAccent">
        <Text className="text-2xl font-serif text-churchDark mb-4">Regions We Serve</Text>
        <Text className="text-gray-800 font-sans leading-6">
          We have active congregations and outreach programs in:
        </Text>
        <View className="mt-3 space-y-2">
          <Text className="text-churchDark">• Western Cape</Text>
          <Text className="text-churchDark">• Gauteng</Text>
          <Text className="text-churchDark">• KwaZulu-Natal</Text>
          <Text className="text-churchDark">• Eastern Cape</Text>
        </View>
      </View>

      {/* Community Section */}
      <View className="px-6 py-8">
        <Text className="text-2xl font-serif text-churchDark mb-4">Our Community</Text>
        <Text className="text-base font-sans text-gray-700 leading-6">
          We believe in building strong bonds within our congregation and reaching out to the less fortunate.
          Our programs include youth groups, charity events, and spiritual retreats that unite our members
          across South Africa.
        </Text>
      </View>

      {/* Call to Action Buttons */}
      <View className="items-center py-8 space-y-4">
        <TouchableOpacity
          className="bg-churchOrange px-6 py-3 rounded-full shadow"
          onPress={() => navigation.navigate("UserTabs")}
        >
          <Text className="text-white font-semibold">Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-churchDark px-6 py-3 rounded-full shadow"
          onPress={() => navigation.navigate("AdminTabs")}
        >
          <Text className="text-white font-semibold">Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
