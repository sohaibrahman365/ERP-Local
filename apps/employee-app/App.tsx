import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import AttendanceScreen from "./src/screens/AttendanceScreen";
import LeaveScreen from "./src/screens/LeaveScreen";
import PayslipScreen from "./src/screens/PayslipScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator>
        <Tab.Screen name="Attendance" component={AttendanceScreen} />
        <Tab.Screen name="Leave" component={LeaveScreen} />
        <Tab.Screen name="Payslips" component={PayslipScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
