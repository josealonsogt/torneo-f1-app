import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
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
import { db } from "../services/firebaseConfig"; // <-- Importamos db para el seguro
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

  // --- 🛡️ SEGURO ANTI-ACCIDENTES ---
  const verificarClasificatoriasTerminadas = async () => {
    const q = query(collection(db, "carreras"), where("fase", "==", "clasificatoria"));
    const snapshot = await getDocs(q);
    let hayPendientes = false;
    
    snapshot.forEach(docSnap => {
      const carrera = docSnap.data();
      // Si la carrera tiene pilotos dentro y NO está finalizada... ¡Peligro!
      if (carrera.participantes && carrera.participantes.length > 0 && carrera.estado !== "finalizada") {
        hayPendientes = true;
      }
    });
    return !hayPendientes; // Devuelve true si todo está en orden
  };

  // --- 🔄 BOTÓN DEL PÁNICO: DESHACER SEMIS ---
  const ejecutarDeshacerSemis = async () => {
    setCargando(true);
    try {
      const batch = writeBatch(db);
      
      // Buscar y destruir las carreras de Semifinales A y B
      const qA = query(collection(db, "carreras"), where("fase", "==", "semifinal_a"));
      const qB = query(collection(db, "carreras"), where("fase", "==", "semifinal_b"));
      const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);
      
      snapA.forEach(d => batch.delete(d.ref));
      snapB.forEach(d => batch.delete(d.ref));
      
      // Volver el reloj a fase clasificatoria
      batch.update(doc(db, "configuracion", "torneo"), { fase_actual: "clasificatoria" });
      
      await batch.commit();
      if (Platform.OS === "web") window.alert("⏪ Marcha Atrás\nSemifinales borradas. Volvemos a Clasificatorias.");
      else Alert.alert("⏪ Marcha Atrás", "Semifinales borradas. Volvemos a Clasificatorias.");
    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") window.alert("Error al deshacer semis.");
      else Alert.alert("Error", "No se pudieron deshacer las semifinales.");
    }
    setCargando(false);
  };

  const handleDeshacerSemis = () => {
    const msj = "¿Te has equivocado al generar las semis?\n\nEsto borrará las semifinales actuales para que puedas terminar las clasificatorias que te faltaban y volver a darle al botón.";
    if (Platform.OS === "web") {
      if (window.confirm("⚠️ Deshacer Semifinales\n" + msj)) ejecutarDeshacerSemis();
    } else {
      Alert.alert("⚠️ Deshacer Semifinales", msj, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, Deshacer", style: "destructive", onPress: ejecutarDeshacerSemis }
      ]);
    }
  };

  // --- FUNCIONES DE LÓGICA ---
  const handleGenerarPilotosPrueba = async () => { /* ... (igual que antes) ... */ setCargando(true); await generarPilotosPrueba(); setCargando(false); };
  const ejecutarLimpieza = async () => { setCargando(true); await limpiarJugadores(); setCargando(false); };
  const handleLimpiarBaseDeDatos = async () => { if (Platform.OS === "web") { if(window.confirm("⚠️ Borrar Todo")) ejecutarLimpieza(); } else { Alert.alert("⚠️ Borrar Todo", "Seguro?", [{ text: "Cancelar" }, { text: "Sí", onPress: ejecutarLimpieza }]); } };
  const ejecutarLimpiezaCarreras = async () => { setCargando(true); await limpiarCarreras(); setCargando(false); };
  const handleLimpiarCarreras = async () => { if (Platform.OS === "web") { if(window.confirm("☢️ Borrar Carreras")) ejecutarLimpiezaCarreras(); } else { Alert.alert("☢️ Borrar Carreras", "Seguro?", [{ text: "Cancelar" }, { text: "Sí", onPress: ejecutarLimpiezaCarreras }]); } };
  const handleAbrirInscripciones = async () => { setCargando(true); await abrirInscripciones(); setCargando(false); };
  const handleCerrarPuerta = async () => { setCargando(true); await setEstadoInscripciones(false); setCargando(false); };
  const handleAbrirPuerta = async () => { setCargando(true); await setEstadoInscripciones(true); setCargando(false); };

  const handleGenerarSemifinalesA = async () => {
    setCargando(true);
    const todoListo = await verificarClasificatoriasTerminadas();
    if (!todoListo) {
      setCargando(false);
      const msjError = "Aún quedan Clasificatorias pendientes por terminar o con pilotos dentro. Termínalas primero antes de arrancar el autobús.";
      if (Platform.OS === "web") window.alert("🛑 ALTO AHÍ\n" + msjError);
      else Alert.alert("🛑 ALTO AHÍ", msjError);
      return;
    }

    const exito = await generarSemifinalesA();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡Listo! 🏁\nSemifinales A generadas.");
      else Alert.alert("¡Listo! 🏁", "Semifinales A generadas.");
    } else {
      if (Platform.OS === "web") window.alert("❌ Error\nFaltan finalistas.");
      else Alert.alert("❌ Error", "Faltan finalistas.");
    }
  };

  const handleGenerarSemifinalesB = async () => {
    setCargando(true);
    const todoListo = await verificarClasificatoriasTerminadas();
    if (!todoListo) {
      setCargando(false);
      if (Platform.OS === "web") window.alert("🛑 ALTO AHÍ\nTermina todas las clasificatorias primero.");
      else Alert.alert("🛑 ALTO AHÍ", "Termina todas las clasificatorias primero.");
      return;
    }

    const exito = await generarSemifinalesB();
    setCargando(false);
    if (exito) {
      if (Platform.OS === "web") window.alert("¡Listo! 🏁\nSemifinales B generadas.");
      else Alert.alert("¡Listo! 🏁", "Semifinales B generadas.");
    } else {
      if (Platform.OS === "web") window.alert("❌ Error\nFaltan finalistas.");
      else Alert.alert("❌ Error", "Faltan finalistas.");
    }
  };

  const handleGenerarFinalB = async () => { setCargando(true); await generarFinalB(); setCargando(false); };
  const handleGenerarFinal = async () => { setCargando(true); await generarFinal(); setCargando(false); };

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

      {/* 2. SECCIÓN DE GESTIÓN */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>2. Gestión del Torneo</Text>
        <Boton titulo="📝 Gestionar Carreras y Resultados" color="#003049" onPress={() => navigation.navigate("GestionCarrerasScreen")} />
        <Boton titulo="👥 Lista y Control de Pilotos" color="#003049" onPress={() => navigation.navigate("GestionPilotosScreen")} />
        <Boton titulo="🔄 Mover Pilotos de Carrera" color="#0077b6" onPress={() => navigation.navigate("MoverPilotosScreen")} />
        
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

      {/* 4. SECCIÓN HERRAMIENTAS DE PRUEBA Y RESET */}
      <View style={styles.tarjetaPeligro}>
        <Text style={styles.tituloTarjetaPeligro}>⚙️ Herramientas y Reset</Text>
        <Boton titulo="Simular 128 Pilotos (Bots)" color="#6c757d" onPress={handleGenerarPilotosPrueba} />
        <Boton titulo="⏪ Deshacer Semifinales" color="#e0a96d" onPress={handleDeshacerSemis} />
        
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