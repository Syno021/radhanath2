// app/navigation/AdminTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../../screens/Home";
import Profile from "../../screens/Profile";
import ExploreStack from "../../app/navigation/ExploreStack";
import { Ionicons } from "@expo/vector-icons";

export type UserTabParamList = {
  Home: undefined;
  Sermons: undefined;
  Profile: undefined;
  Explore: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF8C42",
        tabBarStyle: { backgroundColor: "#FFF5E6" },
      }}
    >
      {/* <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      /> */}
      <Tab.Screen
        name="Explore"
        component={ExploreStack}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
