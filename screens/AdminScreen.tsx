import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  generarPilotosDePrueba,
  limpiarJugadores
} from "../services/adminService";
import {
  generarCarrerasClasificatorias,
  generarFinal,
  generarFinalB,
  generarSemifinalesA,
  generarSemifinalesB
} from "../services/torneoService";

export default function AdminScreen() {
  const navigation = useNavigation<any>();

  // Estado para saber si la app está trabajando y bloquear los botones
  const [cargando, setCargando] = useState(false);

  const handleGenerarPilotos = async () => {
    setCargando(true);
    const exito = await generarPilotosDePrueba();
    setCargando(false);

    if (exito) {
      Alert.alert(
        "Éxito 🚀",
        "Se han inyectado 128 pilotos de prueba en la base de datos.",
      );
    } else {
      Alert.alert("Error", "Hubo un problema al generar los pilotos.");
    }
  };

  const handleLimpiarBaseDeDatos = async () => {
    // Alerta de confirmación para evitar accidentes
    Alert.alert(
      "⚠️ PELIGRO",
      "¿Estás seguro de que quieres BORRAR TODOS los jugadores de la base de datos?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, borrar todo",
          style: "destructive",
          onPress: async () => {
            setCargando(true);
            const exito = await limpiarJugadores();
            setCargando(false);

            if (exito) {
              Alert.alert(
                "Limpieza completada 🧹",
                "Ya no hay jugadores inscritos.",
              );
            } else {
              Alert.alert("Error", "No se pudo limpiar la base de datos.");
            }
          },
        },
      ],
    );
  };

  const handleGenerarClasificatorias = async () => {
    setCargando(true);
    const exito = await generarCarrerasClasificatorias();
    setCargando(false);

    if (exito) {
      Alert.alert(
        "¡Listo! 🏁",
        "Se han generado 16 carreras clasificatorias. Los jugadores ya tienen asignada su carrera.",
      );
    } else {
      Alert.alert("Error", "Hubo un problema al generar las clasificatorias.");
    }
  };

  const handleGenerarSemifinalesA = async () => {
    setCargando(true);
    const exito = await generarSemifinalesA();
    setCargando(false);

    if (exito) {
      Alert.alert("¡Listo! 🏁", "Semifinales A generadas (1° de cada clasificatoria)");
    } else {
      Alert.alert("Error", "Verifica que las 16 clasificatorias estén finalizadas.");
    }
  };

  const handleGenerarSemifinalesB = async () => {
    setCargando(true);
    const exito = await generarSemifinalesB();
    setCargando(false);

    if (exito) {
      Alert.alert("¡Listo! 🏁", "Semifinales B generadas (2° de cada clasificatoria)");
    } else {
      Alert.alert("Error", "Verifica que las 16 clasificatorias estén finalizadas.");
    }
  };

  const handleGenerarFinalB = async () => {
    setCargando(true);
    const exito = await generarFinalB();
    setCargando(false);

    if (exito) {
      Alert.alert("¡Listo! 🏁", "Final B generada (Top 4 de cada Semifinal B)");
    } else {
      Alert.alert("Error", "Verifica que las 2 semifinales B estén finalizadas.");
    }
  };

  const handleGenerarFinal = async () => {
    setCargando(true);
    const exito = await generarFinal();
    setCargando(false);

    if (exito) {
      Alert.alert("¡GRAN FINAL! 🏆", "¡La gran final ha sido generada!");
    } else {
      Alert.alert("Error", "Verifica que las semifinales A y Final B estén completas.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>⚙️ Centro de Mando</Text>
      <Text style={styles.subtitulo}>Solo acceso para organización</Text>

      {/* Si está cargando, mostramos la ruedita */}
      {cargando && (
        <ActivityIndicator
          size="large"
          color="#c1121f"
          style={{ marginBottom: 20 }}
        />
      )}

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>1. Herramientas de Prueba</Text>
        <Button
          title="Generar 128 Pilotos Falsos"
          color="#003049"
          onPress={handleGenerarPilotos}
          disabled={cargando}
        />
        <View style={{ height: 15 }} />
        <Button
          title="Borrar TODOS los Jugadores"
          color="#c1121f"
          onPress={handleLimpiarBaseDeDatos}
          disabled={cargando}
        />
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>2. Control del Torneo</Text>
        <Button
          title="Generar Clasificatorias (16 Carreras)"
          color="#e63946"
          onPress={handleGenerarClasificatorias}
          disabled={cargando}
        />
        <View style={{ height: 15 }} />
        <Button
          title="Gestionar Carreras y Resultados"
          color="#003049"
          onPress={() => navigation.navigate("GestionCarrerasScreen")}
          disabled={cargando}
        />
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>3. Avanzar de Fase</Text>
        <Button
          title="Generar Semifinales A (1° clasificatorias)"
          color="#2a9d8f"
          onPress={handleGenerarSemifinalesA}
          disabled={cargando}
        />
        <View style={{ height: 10 }} />
        <Button
          title="Generar Semifinales B (2° clasificatorias)"
          color="#2a9d8f"
          onPress={handleGenerarSemifinalesB}
          disabled={cargando}
        />
        <View style={{ height: 10 }} />
        <Button
          title="Generar Final B (Top 4 Semi B)"
          color="#f4a261"
          onPress={handleGenerarFinalB}
          disabled={cargando}
        />
        <View style={{ height: 10 }} />
        <Button
          title="Generar GRAN FINAL"
          color="#e76f51"
          onPress={handleGenerarFinal}
          disabled={cargando}
        />
      </View>

      <Button
        title="Cerrar Sesión Admin"
        color="#666"
        onPress={() => navigation.replace("Login")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fdf0d5" },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#003049",
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  seccion: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#003049",
  },
});
