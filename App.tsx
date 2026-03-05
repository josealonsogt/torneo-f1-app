import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from 'expo-font'; // 1. Importamos el lector de fuentes
import * as SplashScreen from 'expo-splash-screen'; // 2. Importamos la pantalla de carga
import React, { useEffect } from "react";
import AppNavigator from "./navigation/AppNavigator";

// Esto frena el arranque de la app hasta que las letras estén listas
SplashScreen.preventAutoHideAsync();

export default function App() {
  console.log("App.tsx cargado correctamente");

  // 3. CARGAMOS TUS FUENTES KAIZO
  const [fontsLoaded] = useFonts({
  'AwesomeSunday': require('./assets/fonts/awesome_sunday/AwesomeSunday.ttf'),
  'Raleway': require('./assets/fonts/Raleway/static/Raleway-Regular.ttf'),
  'Raleway-Bold': require('./assets/fonts/Raleway/static/Raleway-Bold.ttf'),
});
  // 4. CUANDO CARGUEN, ARRANCAMOS LA APP
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Si no han cargado, se queda la pantalla en blanco 1 segundo
  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}