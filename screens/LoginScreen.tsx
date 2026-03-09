import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { accederTorneo } from "../services/authService";
import { Colors, Fonts } from "../types/theme";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarAcceso = async () => {
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

    if (resultado.error) {
      if (Platform.OS === "web") {
        window.alert("⛔ ACCESO DENEGADO\n" + resultado.error);
      } else {
        Alert.alert("Acceso Denegado 🔒", resultado.error);
      }
      return;
    }

    if (resultado.id) {
      // 🆕 CONFIRMACIÓN VISUAL SI ES NUEVO
      if (resultado.esNuevo && resultado.carreraAsignada) {
        const mensaje = `🏁 ¡BIENVENIDO AL PADDOCK!\n\n` +
                        `Piloto: ${nombre.toUpperCase()}\n` +
                        `Carrera: ${resultado.carreraAsignada.nombre}\n` +
                        `Número: ${resultado.carreraAsignada.numero}\n\n` +
                        `Tu slot está reservado. ¡Nos vemos en pista!`;
        
        if (Platform.OS === "web") {
          window.alert(mensaje);
        } else {
          Alert.alert("✅ REGISTRO CONFIRMADO", mensaje, [
            { text: "IR A MI PADDOCK", onPress: () => navigation.replace("HomeScreen", { jugadorId: resultado.id }) }
          ]);
          return;
        }
      }
      
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
      <ScrollView contentContainerStyle={styles.card} showsVerticalScrollIndicator={false}>
        
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

        {/* BOTÓN ENTRAR (ROJO) */}
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

        {/* BOTÓN WHATSAPP (VERDE) */}
        <TouchableOpacity 
          style={styles.botonWhatsapp}
          onPress={() => Linking.openURL("https://chat.whatsapp.com/PON_AQUI_TU_ENLACE")} 
        >
          <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
          <Text style={styles.textoBotonWhatsapp}>ÚNETE AL CHAT DE PILOTOS</Text>
        </TouchableOpacity>

        {/* ENLACE TORNEO PÚBLICO */}
        <TouchableOpacity 
          style={styles.linkContainer} 
          onPress={() => navigation.navigate("TorneoPublicoScreen")}
        >
          <Text style={styles.linkTexto}>Ver cuadrante público del torneo →</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    justifyContent: "center", 
    padding: 20 
  },
  
  card: { 
    backgroundColor: Colors.surface, 
    padding: 30, 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: Colors.border, // 🔮 Borde morado Kaizō
    shadowColor: Colors.primary, // 🔮 Sombra morada
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 10 
  },
  
  header: { 
    alignItems: "center", 
    marginBottom: 20, 
    borderBottomWidth: 2, 
    borderBottomColor: Colors.primary, // 🔮 Línea morada
    paddingBottom: 15 
  },
  
  titulo: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: Colors.gold, 
    fontFamily: Fonts.title, // 🎯 AWESOME SUNDAY
    fontStyle: "italic", 
    letterSpacing: 2 
  },
  
  subtitulo: { 
    fontSize: 16, 
    color: Colors.textPrimary, 
    fontWeight: "bold", 
    letterSpacing: 5, 
    marginTop: 5 
  },
  
  instrucciones: { 
    color: Colors.textMuted, 
    textAlign: "center", 
    marginBottom: 25, 
    fontSize: 12, 
    letterSpacing: 1 
  },
  
  form: { marginBottom: 25 },
  
  label: { 
    color: Colors.primary, // 🔮 Morado para labels
    fontSize: 10, 
    fontWeight: "bold", 
    marginBottom: 5, 
    letterSpacing: 2 
  },
  
  input: { 
    backgroundColor: Colors.background, 
    color: Colors.textPrimary, 
    borderWidth: 1, 
    borderColor: Colors.card, 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 2, 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  
  // 🔮 Botón Morado Kaizō (antes era rojo)
  boton: { 
    backgroundColor: Colors.primary, 
    paddingVertical: 18, 
    borderRadius: 2, 
    alignItems: "center" 
  },
  
  botonDesactivado: { 
    backgroundColor: Colors.primaryDark, 
    opacity: 0.6
  },
  
  textoBoton: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "900", 
    letterSpacing: 2 
  },

  // Botón Verde (WhatsApp) - AJUSTADO
  botonWhatsapp: {
    backgroundColor: "#25D366", 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15, // Un poco menos de padding
    paddingHorizontal: 10, // Padding lateral para que no toque los bordes
    borderRadius: 2,
    marginTop: 15,
    gap: 8,
  },
  textoBotonWhatsapp: {
    color: "#fff",
    fontSize: 12, // Letra un poco más pequeña para que quepa bien
    fontWeight: "900",
    letterSpacing: 1,
    flexShrink: 1, // Esto hace que si no cabe, se encoja en vez de salirse
    textAlign: 'center'
  },

  // Enlace Inferior
  linkContainer: {
    marginTop: 25,
    alignItems: 'center'
  },
  linkTexto: {
    color: Colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  }
});