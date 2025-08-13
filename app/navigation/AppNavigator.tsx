import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../../screens/Home";
import UserTabs from "./UserTabs";
import AdminTabs from "./AdminTabs";
import Login from "../../screens/Login";
import Register from "../../screens/Register";



export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  UserTabs: undefined;
  AdminTabs: undefined;
  Login: undefined;
  Register: undefined;
  LoadBook: undefined;
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
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
