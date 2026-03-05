import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AdminScreen from "../screens/AdminScreen";
import GestionCarrerasScreen from "../screens/GestionCarrerasScreen";
import GestionPilotosScreen from "../screens/GestionPilotosScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MoverPilotosScreen from '../screens/MoverPilotosScreen';
import PantallaGiganteScreen from "../screens/PantallaGiganteScreen";
import PantallaGrandeDesktopScreen from "../screens/PantallaGrandeDesktopScreen";
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
      <Stack.Screen name="PantallaGiganteScreen" component={PantallaGiganteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PantallaGrandeDesktopScreen" component={PantallaGrandeDesktopScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GestionPilotosScreen" component={GestionPilotosScreen} options={{ title: "Control de Pilotos" }} />
      <Stack.Screen name="MoverPilotosScreen" component={MoverPilotosScreen} />
    </Stack.Navigator>
  );
}