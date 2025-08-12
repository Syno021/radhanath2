import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Explore from "../../screens/Explore";
import Book from "../../screens/Book";
import Clubs from "../../screens/Clubs";
import Groups from "../../screens/Groups";
import Regions from "../../screens/Regions";
import Temples from "../../screens/Temples";

export type ExploreStackParamList = {
    Explore: undefined;
  Temples: undefined;
  Book: undefined;
  Clubs: undefined;
  Groups: undefined;
  Regions: undefined; 
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function AdminManagementStack() {
  return (
    <Stack.Navigator>
        <Stack.Screen 
            name="Explore" 
            component={Explore}
            options={{ headerShown: false }}
        />
      <Stack.Screen 
        name="Book" 
        component={Book}
        options={{ title: "Books" }}
      />
      <Stack.Screen 
        name="Clubs" 
        component={Clubs}
        options={{ title: "Book Clubs" }}
      />
      <Stack.Screen 
        name="Groups" 
        component={Groups}
        options={{ title: "Groups" }}
      />
      <Stack.Screen 
        name="Regions" 
        component={Regions}
        options={{ title: "Regions" }}
      />
      <Stack.Screen 
        name="Temples" 
        component={Temples}
        options={{ title: "Temples" }}
      />
    </Stack.Navigator>
  );
}
