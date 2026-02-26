import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AdminScreen from "../screens/AdminScreen";
import GestionCarrerasScreen from "../screens/GestionCarrerasScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import TorneoPublicoScreen from '../screens/TorneoPublicoScreen';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: "Inicio" }} />
      <Stack.Screen name="AdminScreen" component={AdminScreen} options={{ title: "Panel Admin" }} />
      <Stack.Screen name="GestionCarrerasScreen" component={GestionCarrerasScreen} options={{ title: "Gestión de Carreras" }} />
      <Stack.Screen name="TorneoPublicoScreen" component={TorneoPublicoScreen} options={{ title: 'Cuadrante del Torneo' }}/>
    </Stack.Navigator>
  );
}