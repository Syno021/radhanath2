import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import ForgotPassword from "../../screens/ForgotPassword";
import Home from "../../screens/Home";
import Login from "../../screens/Login";
import Register from "../../screens/Register";
import About from "../../screens/about";
import AdminTabs from "./AdminTabs";
import UserTabs from "./UserTabs";



export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  UserTabs: undefined;
  AdminTabs: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  LoadBook: undefined;
  About: undefined; // Added About screen
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* First screen that loads */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="UserTabs" component={UserTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="About" component={About} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}
