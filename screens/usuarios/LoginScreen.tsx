import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

//  ARCHIVO DE CONFIGURACIÓN CENTRAL (El cerebro del diseño)
import { TorneoConfig } from "../../config/torneoConfig";
import { accederTorneo } from "../../services/authService";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  
  // 💾ESTADOS DEL FORMULARIO
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [cargando, setCargando] = useState(false);

  //  FUNCIÓN PRINCIPAL: MANEJO DEL LOGIN
  const manejarAcceso = async () => {
    // 1. Validación de campos vacíos
    if (!nombre || !correo || !dni) {
      if (Platform.OS === "web") window.alert("⚠️ DATOS INCOMPLETOS\n\nPor favor, completa todos los campos para continuar con tu inscripción.");
      else Alert.alert("⚠️ DATOS INCOMPLETOS", "Por favor, completa todos los campos para continuar con tu inscripción.");
      return;
    }

    // 2. Puerta trasera para el Administrador
    if (correo.trim().toLowerCase() === "admin@torneo.com" && dni.trim().toLowerCase() === "admin") {
      navigation.replace("AdminScreen");
      return;
    }

    // 3. Inicio del proceso de registro/acceso en base de datos
    setCargando(true);
    const resultado = await accederTorneo(nombre, correo, dni);
    setCargando(false);

    // 4. Manejo de errores (ej. Torneo cerrado)
    if (resultado.error) {
      if (Platform.OS === "web") window.alert("⛔ ACCESO DENEGADO\n" + resultado.error);
      else Alert.alert("Acceso Denegado 🔒", resultado.error);
      return;
    }

    // 5. Acceso exitoso
    if (resultado.id) {
      // Si es su primera vez, le mostramos un ticket de bienvenida
      if (resultado.esNuevo && resultado.carreraAsignada) {
        const mensaje = `🏁 ¡BIENVENIDO AL TORNEO!\n\nPiloto: ${nombre.toUpperCase()}\nCarrera: ${resultado.carreraAsignada.nombre}\nNúmero: ${resultado.carreraAsignada.numero}\n\nTu sitio está reservado. ¡Nos vemos en pista!`;
        
        if (Platform.OS === "web") {
          window.alert(mensaje);
        } else {
          Alert.alert("✅ REGISTRO CONFIRMADO", mensaje, [
            { text: "IR A MI BOX", onPress: () => navigation.replace("HomeScreen", { jugadorId: resultado.id }) }
          ]);
          return;
        }
      }
      // Si no es nuevo, entra directo a su Box
      navigation.replace("HomeScreen", { jugadorId: resultado.id });
    } else {
      // Fallo de conexión o error crítico
      if (Platform.OS === "web") window.alert("❌ ERROR DE CONEXIÓN\n\nNo hemos podido conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.");
      else Alert.alert("❌ ERROR DE CONEXIÓN", "No hemos podido conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.");
    }
  };

  return (
    // ⌨️ KeyboardAvoidingView: Evita que el teclado tape el formulario en móviles
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      
      {/* FONDO DE LA APP */}
      <LinearGradient
        colors={TorneoConfig.colores.fondoGradiente as any}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.fondoDegradado}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. LOGO SUPERIOR (El escudo del Torneo) */}
          <View style={styles.logoContainerTop}>
            <Image 
              source={require('../../assets/Logo Kaizo Sim blanco.png')} 
              style={styles.logoEscudo} 
              resizeMode="contain" 
            />
          </View>

          {/* 2. TARJETA PRINCIPAL (Efecto Glassmorphism) */}
          <View style={styles.card}>
            
            {/* --- CABECERA DE LA TARJETA --- */}
            <View style={styles.headerCard}>
              <Text style={styles.tituloCard}>{TorneoConfig.nombreLargo}</Text>
              
              <Image source={require('../../assets/Recurso 5recursos.png')} style={styles.lineaSeparadora} resizeMode="cover"/>
              
              <Text style={styles.subtitulo}>{TorneoConfig.subtitulo}</Text>
            </View>
            
            <Text style={styles.instrucciones}>Introduce tus datos para acceder al torneo y ver tu parrilla de salida.</Text>

            {/* --- FORMULARIO DE ACCESO --- */}
            <View style={styles.form}>
              <Text style={styles.label}>NOMBRE EN PISTA</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej: Fernando Alonso" 
                placeholderTextColor="rgba(255,255,255,0.3)" 
                value={nombre} 
                onChangeText={setNombre} 
              />
              
              <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
              <TextInput 
                style={styles.input} 
                placeholder="piloto@email.com" 
                placeholderTextColor="rgba(255,255,255,0.3)" 
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={correo} 
                onChangeText={setCorreo} 
              />
              
              <Text style={styles.label}>DNI / IDENTIFICACIÓN</Text>
              <TextInput 
                style={styles.input} 
                placeholder="12345678X" 
                placeholderTextColor="rgba(255,255,255,0.3)" 
                autoCapitalize="characters" 
                value={dni} 
                onChangeText={setDni} 
              />
            </View>
          
            {/* --- BOTONES DE ACCIÓN --- */}
            
            {/* Botón Principal: Entrar (Con el color dinámico del config) */}
            <TouchableOpacity 
              style={[styles.botonMinimalista, cargando && styles.botonDesactivado]} 
              onPress={manejarAcceso} 
              disabled={cargando}
            >
              <LinearGradient
                colors={[TorneoConfig.colores.primario, TorneoConfig.colores.primarioOscuro]}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.linearGradientBoton}
              >
                {cargando ? (
                  <Text style={styles.textoBotonMinimalista}>CARGANDO MOTOR...</Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.textoBotonMinimalista}>ENTRAR A PISTA</Text>
                    <MaterialCommunityIcons name="flag-checkered" size={18} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Botón Secundario: WhatsApp */}
            <TouchableOpacity 
              style={styles.botonMinimalistaWhatsapp} 
              onPress={() => Linking.openURL(TorneoConfig.whatsappGrupo)}
            >
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              <Text style={styles.textoBotonMinimalistaWhatsapp}>ÚNETE AL CHAT DE PILOTOS</Text>
            </TouchableOpacity>

            {/* Enlace al Cuadrante Público */}
            <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate("TorneoPublicoScreen")}>
              <Text style={styles.linkTexto}>Ver cuadrante público del torneo →</Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// HOJA DE ESTILOS (Ordenada por secciones)
// ==========================================
const styles = StyleSheet.create({
  
  // 1. CONTENEDORES PRINCIPALES
  container: { flex: 1 },
  fondoDegradado: { flex: 1, width: '100%', height: '100%' },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  
  // 2. LOGO SUPERIOR
  logoContainerTop: { alignItems: 'center', marginBottom: 30 },
  logoEscudo: { width: 280, height: 95 },

  // 3. TARJETA CRISTAL (Glassmorphism)
  card: { 
    backgroundColor: 'rgba(12, 12, 15, 0.85)', 
    padding: 25, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 20 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 20, 
    elevation: 15,
  },
  
  // 4. CABECERA DE LA TARJETA
  headerCard: { alignItems: "center", marginBottom: 20, paddingBottom: 10, width: '100%' },
  tituloCard: { fontSize: 28, fontWeight: "900", color: "#fff", fontStyle: "italic", letterSpacing: 2, textAlign: 'center' },
  lineaSeparadora: { width: '100%', height: 8, marginTop: 12, marginBottom: 12, opacity: 0.9 },
  subtitulo: { fontSize: 12, color: '#e1e1e1', fontWeight: "bold", letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  instrucciones: { color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 20, fontSize: 12, letterSpacing: 0.5 },
  
  // 5. FORMULARIO E INPUTS
  form: { marginBottom: 20 },
  label: { color: '#e1e1e1', fontSize: 10, fontWeight: "bold", marginBottom: 5, letterSpacing: 2 },
  input: { 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', color: "#fff", 
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", 
    padding: 15, marginBottom: 15, borderRadius: 6, fontSize: 14, fontWeight: 'bold',
    borderLeftWidth: 3, borderLeftColor: TorneoConfig.colores.primario, //Borde dinámico
  },
  
  // 6. BOTONES DE ACCIÓN
  botonMinimalista: { 
    backgroundColor: 'transparent', 
    borderRadius: 30, 
    alignItems: "center", 
    marginBottom: 10, 
    overflow: 'hidden', 
    // Suspensión adaptativa: Sin sombras raras en Web, con brillo en Móvil
    ...Platform.select({
      web: { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 },
      default: { shadowColor: TorneoConfig.colores.primario, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }
    }),
  },
  linearGradientBoton: { width: '100%', paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  botonDesactivado: { opacity: 0.5 },
  textoBotonMinimalista: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },

  botonMinimalistaWhatsapp: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 12, paddingHorizontal: 10, 
    borderRadius: 30, marginTop: 10, gap: 8, 
    borderWidth: 2, borderColor: "rgba(37, 211, 102, 0.7)" 
  },
  textoBotonMinimalistaWhatsapp: { color: "#25D366", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textAlign: 'center' },

  linkContainer: { marginTop: 25, alignItems: 'center' },
  linkTexto: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecorationLine: 'underline' }
});