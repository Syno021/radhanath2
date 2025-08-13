//navigation/AdminTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from "../../screens/Dashboard";
import Profile from "../../screens/Profile";
import AdminManagementStack from "./AdminManagementStack";

import { Ionicons } from "@expo/vector-icons";

export type AdminTabParamList = {
  Dashboard: undefined;
  Profile: undefined;
  AdminManagement: undefined;
  LoadBook: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF8C42",
        tabBarStyle: { backgroundColor: "#FFF5E6" },
        tabBarLabelStyle: { paddingBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminManagement"
        component={AdminManagementStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="LoadBook"
        component={LoadBook}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
          tabBarLabel: "Books",
        }}
      /> */}
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
