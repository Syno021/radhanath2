import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminManagement from "../../screens/AdminManagement";
import AdminBooks from "../../screens/AdminBooks";
import AdminClubs from "../../screens/AdminClubs";
import AdminGroups from "../../screens/AdminGroups";
import AdminRdm from "../../screens/AdminRdm";

export type AdminManagementStackParamList = {
  AdminManagementHome: undefined;
  AdminBooks: undefined;
  AdminClubs: undefined;
  AdminGroups: undefined;
  AdminRdm: undefined; 
};

const Stack = createNativeStackNavigator<AdminManagementStackParamList>();

export default function AdminManagementStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminManagementHome" 
        component={AdminManagement}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen 
        name="AdminBooks" 
        component={AdminBooks}
        options={{ title: "Add Books" }}
      /> */}
      <Stack.Screen 
        name="AdminClubs" 
        component={AdminClubs}
        options={{ title: "Add Book Clubs" }}
      />
      <Stack.Screen 
        name="AdminGroups" 
        component={AdminGroups}
        options={{ title: "Add Groups" }}
      />
      <Stack.Screen 
        name="AdminRdm" 
        component={AdminRdm}
        options={{ title: "Add Regions" }}
      />
    </Stack.Navigator>
  );
}
