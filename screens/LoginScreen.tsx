import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { accederTorneo } from "../services/authService";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarAcceso = async () => {
    // 🚨 PARCHE WEB: Avisar si faltan datos
    if (!nombre || !correo || !dni) {
      if (Platform.OS === "web") {
        window.alert("⚠️ FALTAN DATOS\nPor favor, rellena todos los campos para calentar motores.");
      } else {
        Alert.alert("Faltan datos", "Por favor, rellena todos los campos para calentar motores.");
      }
      return;
    }

    // Acceso secreto para el Admin
    if (correo.trim().toLowerCase() === "admin@torneo.com" && dni.trim().toLowerCase() === "admin") {
      navigation.replace("AdminScreen");
      return;
    }

    setCargando(true);
    const resultado = await accederTorneo(nombre, correo, dni);
    setCargando(false);

    // 🔒 PARCHE WEB: Avisar si el portero no te deja entrar
    if (resultado.error) {
      if (Platform.OS === "web") {
        window.alert("⛔ ACCESO DENEGADO\n" + resultado.error);
      } else {
        Alert.alert("Acceso Denegado 🔒", resultado.error);
      }
      return;
    }

    // Si todo va bien y tenemos ID, pa' dentro
    if (resultado.id) {
      navigation.replace("HomeScreen", { jugadorId: resultado.id });
    } else {
      if (Platform.OS === "web") {
        window.alert("❌ ERROR EN BOXES\nInténtalo de nuevo.");
      } else {
        Alert.alert("Error en Boxes", "Inténtalo de nuevo.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        
        {/* LOGO / TÍTULO */}
        <View style={styles.header}>
          <Text style={styles.titulo}>MATSURI RACING</Text>
          <Text style={styles.subtitulo}>TORNEO OFICIAL</Text>
        </View>

        <Text style={styles.instrucciones}>Introduce tus datos para acceder al paddock y ver tu parrilla de salida.</Text>

        {/* FORMULARIO */}
        <View style={styles.form}>
          <Text style={styles.label}>NOMBRE EN PISTA</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej: Fernando Alonso" 
            placeholderTextColor="#666"
            value={nombre} 
            onChangeText={setNombre} 
          />
          
          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <TextInput 
            style={styles.input} 
            placeholder="piloto@email.com" 
            placeholderTextColor="#666"
            keyboardType="email-address" 
            autoCapitalize="none" 
            value={correo} 
            onChangeText={setCorreo} 
          />
          
          <Text style={styles.label}>DNI / IDENTIFICACIÓN</Text>
          <TextInput 
            style={styles.input} 
            placeholder="12345678X" 
            placeholderTextColor="#666"
            autoCapitalize="characters"
            value={dni} 
            onChangeText={setDni} 
          />
        </View>

        {/* BOTÓN ENTRAR */}
        <TouchableOpacity 
          style={[styles.boton, cargando && styles.botonDesactivado]} 
          onPress={manejarAcceso}
          disabled={cargando}
        >
          {cargando ? (
            <Text style={styles.textoBoton}>CARGANDO MOTOR...</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.textoBoton}>ENTRAR A PISTA</Text>
              <MaterialCommunityIcons name="flag-checkered" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#151515", padding: 30, borderRadius: 4, borderWidth: 1, borderColor: "#222", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
  header: { alignItems: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#e63946", paddingBottom: 15 },
  titulo: { fontSize: 32, fontWeight: "900", color: "#ffd700", fontStyle: "italic", letterSpacing: 2 },
  subtitulo: { fontSize: 16, color: "#fff", fontWeight: "bold", letterSpacing: 5, marginTop: 5 },
  instrucciones: { color: "#666", textAlign: "center", marginBottom: 25, fontSize: 12, letterSpacing: 1 },
  form: { marginBottom: 25 },
  label: { color: "#ffd700", fontSize: 10, fontWeight: "bold", marginBottom: 5, letterSpacing: 2 },
  input: { backgroundColor: "#0f0f0f", color: "#fff", borderWidth: 1, borderColor: "#333", padding: 15, marginBottom: 15, borderRadius: 2, fontSize: 14, fontWeight: 'bold' },
  boton: { backgroundColor: "#e63946", paddingVertical: 18, borderRadius: 2, alignItems: "center" },
  botonDesactivado: { backgroundColor: "#882229" },
  textoBoton: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 2 }
});