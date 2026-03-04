import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    generarPilotosPrueba,
    limpiarCarreras,
    limpiarJugadores
} from "../services/adminService";

import {
    abrirInscripciones,
    generarFinal,
    generarFinalB,
    generarSemifinalesA,
    generarSemifinalesB,
    setEstadoInscripciones
} from "../services/torneoService";

export default function AdminScreen() {
  const navigation = useNavigation<any>();
  const [cargando, setCargando] = useState(false);

  // --- FUNCIONES DE LÓGICA (Mantenidas exactamente igual) ---
  const handleGenerarPilotosPrueba = async () => {
    setCargando(true);
    const exito = await generarPilotosPrueba();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("✅ 128 Bots Creados\nSe han registrado y asignado a sus carreras correctamente.");
      else Alert.alert("✅ 128 Bots Creados", "Se han registrado y asignado a sus carreras correctamente.");
    } else {
      if (Platform.OS === "web") window.alert("Error\nNo se pudieron generar los pilotos.");
      else Alert.alert("Error", "No se pudieron generar los pilotos.");
    }
  };

  const ejecutarLimpieza = async () => {
    setCargando(true);
    const exito = await limpiarJugadores();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("Limpieza completada 🧹\nYa no hay jugadores inscritos.");
      else Alert.alert("Limpieza completada 🧹", "Ya no hay jugadores inscritos.");
    } else {
      if (Platform.OS === "web") window.alert("Error\nNo se pudo limpiar la base de datos.");
      else Alert.alert("Error", "No se pudo limpiar la base de datos.");
    }
  };

  const handleLimpiarBaseDeDatos = async () => {
    const mensajePeligro = "¿Estás seguro de que quieres BORRAR TODOS los jugadores de la base de datos?";
    if (Platform.OS === "web") {
      const seguro = window.confirm("⚠️ PELIGRO\n" + mensajePeligro);
      if (seguro) ejecutarLimpieza();
    } else {
      Alert.alert("⚠️ PELIGRO", mensajePeligro, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, borrar todo", style: "destructive", onPress: ejecutarLimpieza },
      ]);
    }
  };

  const ejecutarLimpiezaCarreras = async () => {
    setCargando(true);
    const exito = await limpiarCarreras();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("Carreras eliminadas 💥\nEl cuadrante está vacío.");
      else Alert.alert("Carreras eliminadas 💥", "El cuadrante está vacío y listo para empezar.");
    } else {
      if (Platform.OS === "web") window.alert("Error al borrar las carreras.");
      else Alert.alert("Error", "No se pudieron borrar las carreras.");
    }
  };

  const handleLimpiarCarreras = async () => {
    const mensajePeligro = "¿Seguro que quieres BORRAR TODAS LAS CARRERAS? Esto vaciará el cuadrante por completo.";
    if (Platform.OS === "web") {
      const seguro = window.confirm("☢️ BOTÓN NUCLEAR\n" + mensajePeligro);
      if (seguro) ejecutarLimpiezaCarreras();
    } else {
      Alert.alert("☢️ BOTÓN NUCLEAR", mensajePeligro, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, destruir carreras", style: "destructive", onPress: ejecutarLimpiezaCarreras },
      ]);
    }
  };

  const handleAbrirInscripciones = async () => {
    setCargando(true);
    const exito = await abrirInscripciones();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡Clasificatorias Creadas! 🏁\nSe han generado las 16 carreras vacías.");
      else Alert.alert("¡Clasificatorias Creadas! 🏁", "Se han generado las 16 carreras vacías.");
    } else {
      if (Platform.OS === "web") window.alert("Error al crear las carreras.");
      else Alert.alert("Error", "Fallo al crear las carreras.");
    }
  };

  const handleCerrarPuerta = async () => {
    setCargando(true);
    const exito = await setEstadoInscripciones(false);
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("🔒 Puerta Cerrada\nNadie puede registrarse en este momento.");
      else Alert.alert("🔒 Puerta Cerrada", "Nadie puede registrarse en este momento.");
    }
  };

  const handleAbrirPuerta = async () => {
    setCargando(true);
    const exito = await setEstadoInscripciones(true);
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("🔓 Puerta Abierta\n¡Inscripciones abiertas! Ya pueden entrar a las carreras.");
      else Alert.alert("🔓 Puerta Abierta", "¡Inscripciones abiertas! Ya pueden entrar a las carreras.");
    }
  };

  const handleGenerarSemifinalesA = async () => {
    setCargando(true);
    const exito = await generarSemifinalesA();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡Listo! 🏁\nSemifinales A generadas (1° de cada clasificatoria)");
      else Alert.alert("¡Listo! 🏁", "Semifinales A generadas (1° de cada clasificatoria)");
    } else {
      const mensaje = "No se han podido generar.\n\nVerifica que:\n• Las 16 clasificatorias estén finalizadas\n• Haya pilotos con estado 'clasificado_semi_a'";
      if (Platform.OS === "web") window.alert("❌ Error\n" + mensaje);
      else Alert.alert("❌ Error", mensaje);
    }
  };

  const handleGenerarSemifinalesB = async () => {
    setCargando(true);
    const exito = await generarSemifinalesB();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡Listo! 🏁\nSemifinales B generadas (2° de cada clasificatoria)");
      else Alert.alert("¡Listo! 🏁", "Semifinales B generadas (2° de cada clasificatoria)");
    } else {
      const mensaje = "No se han podido generar.\n\nVerifica que:\n• Las 16 clasificatorias estén finalizadas\n• Haya pilotos con estado 'clasificado_semi_b'";
      if (Platform.OS === "web") window.alert("❌ Error\n" + mensaje);
      else Alert.alert("❌ Error", mensaje);
    }
  };

  const handleGenerarFinalB = async () => {
    setCargando(true);
    const exito = await generarFinalB();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡Listo! 🏁\nFinal B generada (Top 4 de cada Semifinal B)");
      else Alert.alert("¡Listo! 🏁", "Final B generada (Top 4 de cada Semifinal B)");
    } else {
      const mensaje = "No se ha podido generar.\n\nVerifica que:\n• Las 2 Semifinales B estén finalizadas\n• Haya pilotos con estado 'clasificado_final_b'";
      if (Platform.OS === "web") window.alert("❌ Error\n" + mensaje);
      else Alert.alert("❌ Error", mensaje);
    }
  };

  const handleGenerarFinal = async () => {
    setCargando(true);
    const exito = await generarFinal();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡GRAN FINAL! 🏆\n¡La gran final ha sido generada!");
      else Alert.alert("¡GRAN FINAL! 🏆", "¡La gran final ha sido generada!");
    } else {
      const mensaje = "No se ha podido generar.\n\nVerifica que:\n• Las 2 Semifinales A estén finalizadas\n• La Final B esté finalizada\n• Haya suficientes finalistas";
      if (Platform.OS === "web") window.alert("❌ Error\n" + mensaje);
      else Alert.alert("❌ Error", mensaje);
    }
  };

  // --- COMPONENTE DE BOTÓN PERSONALIZADO PARA UNIFICAR ESTILOS ---
  const Boton = ({ titulo, color, onPress, textColor = "white" }: any) => (
    <TouchableOpacity 
      style={[styles.botonGeneral, { backgroundColor: color }, cargando && { opacity: 0.6 }]} 
      onPress={onPress}
      disabled={cargando}
    >
      <Text style={[styles.textoBoton, { color: textColor }]}>{titulo}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* CABECERA */}
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Centro de Mando</Text>
        <Text style={styles.subtituloHeader}>Panel de Administración</Text>
      </View>

      {/* INDICADOR DE CARGA */}
      {cargando && (
        <View style={styles.cargandoOverlay}>
          <ActivityIndicator size="large" color="#003049" />
          <Text style={styles.textoCargando}>Procesando...</Text>
        </View>
      )}

      {/* 1. SECCIÓN DE INSCRIPCIONES Y PUERTAS */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>1. Inscripciones y Clasificatorias</Text>
        <Boton titulo="Generar 16 Clasificatorias Vacías" color="#0077b6" onPress={handleAbrirInscripciones} />
        
        <View style={styles.filaBotones}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Boton titulo="🔓 ABRIR PUERTA" color="#2a9d8f" onPress={handleAbrirPuerta} />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Boton titulo="🔒 CERRAR PUERTA" color="#495057" onPress={handleCerrarPuerta} />
          </View>
        </View>
      </View>

      {/* 2. SECCIÓN DE GESTIÓN (LO MÁS USADO) */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>2. Gestión del Torneo</Text>
        <Boton titulo="📝 Gestionar Carreras y Resultados" color="#003049" onPress={() => navigation.navigate("GestionCarrerasScreen")} />
        <Boton titulo="👥 Lista y Control de Pilotos" color="#003049" onPress={() => navigation.navigate("GestionPilotosScreen")} />
        
        <View style={styles.separador} />
        
        <TouchableOpacity 
          style={styles.botonProyector} 
          onPress={() => navigation.navigate("PantallaGrandeDesktopScreen")}
          disabled={cargando}
        >
          <Text style={styles.textoBotonProyector}>🖥️ ABRIR PANTALLA GIGANTE</Text>
        </TouchableOpacity>
      </View>

      {/* 3. SECCIÓN AVANZAR DE FASE */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>3. Avanzar de Fase</Text>
        <Boton titulo="Generar Semifinales A (Ganadores)" color="#00b4d8" onPress={handleGenerarSemifinalesA} />
        <Boton titulo="Generar Semifinales B (Segundos)" color="#00b4d8" onPress={handleGenerarSemifinalesB} />
        <Boton titulo="Generar Final B (Repesca)" color="#f4a261" onPress={handleGenerarFinalB} />
        <Boton titulo="Generar GRAN FINAL 🏆" color="#e76f51" onPress={handleGenerarFinal} />
      </View>

      {/* 4. SECCIÓN HERRAMIENTAS DE PRUEBA Y RESET (AL FINAL PARA NO DARLE SIN QUERER) */}
      <View style={styles.tarjetaPeligro}>
        <Text style={styles.tituloTarjetaPeligro}>⚙️ Herramientas y Reset</Text>
        <Boton titulo="Simular 128 Pilotos (Bots)" color="#6c757d" onPress={handleGenerarPilotosPrueba} />
        
        <View style={styles.filaBotones}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Boton titulo="Borrar JUGADORES" color="#e63946" onPress={handleLimpiarBaseDeDatos} />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Boton titulo="Borrar CARRERAS" color="#d00000" onPress={handleLimpiarCarreras} />
          </View>
        </View>
      </View>

      {/* BOTÓN SALIR */}
      <View style={{ paddingBottom: 40, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.replace("Login")} style={{ padding: 15 }}>
          <Text style={{ color: '#888', fontWeight: 'bold' }}>Cerrar Sesión Admin</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f5f6fa", padding: 15 },
  
  header: { alignItems: "center", marginBottom: 20, marginTop: 10 },
  tituloHeader: { fontSize: 28, fontWeight: "bold", color: "#003049" },
  subtituloHeader: { fontSize: 14, color: "#666" },
  
  cargandoOverlay: { backgroundColor: "rgba(255,255,255,0.8)", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 15 },
  textoCargando: { marginTop: 10, fontWeight: "bold", color: "#003049" },

  tarjeta: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tarjetaPeligro: { backgroundColor: "#fff0f0", padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#ffcccc" },
  
  tituloTarjeta: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 5 },
  tituloTarjetaPeligro: { fontSize: 16, fontWeight: "bold", color: "#d00000", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#ffcccc", paddingBottom: 5 },
  
  botonGeneral: { paddingVertical: 14, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  textoBoton: { fontSize: 15, fontWeight: "bold", letterSpacing: 0.5 },
  
  filaBotones: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  
  separador: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
  
  botonProyector: { backgroundColor: "#ffb703", paddingVertical: 15, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#e5a300" },
  textoBotonProyector: { fontSize: 15, fontWeight: "bold", color: "#000", letterSpacing: 0.5 },
});