import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AdminScreen from "../screens/admin/AdminScreen";
import GestionCarrerasScreen from "../screens/admin/GestionCarrerasScreen";
import GestionPilotosScreen from "../screens/admin/GestionPilotosScreen";
import LogsScreen from "../screens/admin/LogsScreen";
import MoverPilotosScreen from '../screens/admin/MoverPilotosScreen';
import PantallaGrandeDesktopScreen from "../screens/admin/PantallaGrandeDesktopScreen";
import HomeScreen from "../screens/usuarios/HomeScreen";
import LoginScreen from "../screens/usuarios/LoginScreen";
import PantallaGiganteScreen from "../screens/usuarios/PantallaGiganteScreen";
import TorneoPublicoScreen from '../screens/usuarios/TorneoPublicoScreen';
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
      <Stack.Screen name="LogsScreen" component={LogsScreen} options={{ title: "Logs de Auditoría" }} />
    </Stack.Navigator>
  );
}