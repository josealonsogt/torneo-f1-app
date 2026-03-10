import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { accederTorneo } from "../services/authService";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarAcceso = async () => {
    if (!nombre || !correo || !dni) {
      if (Platform.OS === "web") window.alert("⚠️ FALTAN DATOS\nPor favor, rellena todos los campos.");
      else Alert.alert("Faltan datos", "Por favor, rellena todos los campos.");
      return;
    }

    if (correo.trim().toLowerCase() === "admin@torneo.com" && dni.trim().toLowerCase() === "admin") {
      navigation.replace("AdminScreen");
      return;
    }

    setCargando(true);
    const resultado = await accederTorneo(nombre, correo, dni);
    setCargando(false);

    if (resultado.error) {
      if (Platform.OS === "web") window.alert("⛔ ACCESO DENEGADO\n" + resultado.error);
      else Alert.alert("Acceso Denegado 🔒", resultado.error);
      return;
    }

    if (resultado.id) {
      if (resultado.esNuevo && resultado.carreraAsignada) {
        const mensaje = `🏁 ¡BIENVENIDO AL TORNEO!\n\n` +
                        `Piloto: ${nombre.toUpperCase()}\n` +
                        `Carrera: ${resultado.carreraAsignada.nombre}\n` +
                        `Número: ${resultado.carreraAsignada.numero}\n\n` +
                        `Tu slot está reservado. ¡Nos vemos en pista!`;
        
        if (Platform.OS === "web") window.alert(mensaje);
        else {
          Alert.alert("✅ REGISTRO CONFIRMADO", mensaje, [
            { text: "IR A MI BOX", onPress: () => navigation.replace("HomeScreen", { jugadorId: resultado.id }) }
          ]);
          return;
        }
      }
      navigation.replace("HomeScreen", { jugadorId: resultado.id });
    } else {
      if (Platform.OS === "web") window.alert("❌ ERROR EN BOXES\nInténtalo de nuevo.");
      else Alert.alert("Error en Boxes", "Inténtalo de nuevo.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* 🌌 FONDO GRAN TURISMO: Azul Noche -> Morado Kaizō -> Destello Rojo */}
      <LinearGradient
        colors={['#050814', '#170c2b', '#481f5c', '#8a1d34']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }} // Degradado en diagonal (más dinámico)
        style={styles.fondoDegradado}
      >
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
        {/* 👑 LOGO DE KAIZO ARRIBA DEL TODO (FUERA DE LA TARJETA) */}
          <View style={styles.logoContainerTop}>
            <Image 
              source={require('../assets/Logo Kaizo Sim blanco.png')} 
              style={styles.logoEscudo}
              resizeMode="contain"
            />
          </View>


          <View style={styles.card}>
            
            {/* TÍTULO LIMPIO EN LUGAR DE TANTOS LOGOS */}
            <View style={styles.headerCard}>
              <Text style={styles.tituloCard}>MATSURI RACING</Text>
              
              {/* 🏁 LÍNEA DE CARRERAS COMO SEPARADOR */}
              <Image 
                source={require('../assets/Recurso 5recursos.png')} 
                style={styles.lineaSeparadora}
                resizeMode="cover"
              />
              
              <Text style={styles.subtitulo}>TORNEO OFICIAL</Text>
            </View>
            <Text style={styles.instrucciones}>Introduce tus datos para acceder al torneo y ver tu parrilla de salida.</Text>

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
          
          {/* 🕹️ BOTÓN ENTRAR 100% MORADO KAIZŌ */}
            <TouchableOpacity 
              style={[styles.botonMinimalista, cargando && styles.botonDesactivado]} 
              onPress={manejarAcceso}
              disabled={cargando}
            >
              <LinearGradient
                colors={['#8b48ba', '#4a2564']} // 🔮 Degradado puramente morado (brillante a oscuro)
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
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


            <TouchableOpacity 
              style={styles.botonMinimalistaWhatsapp}
              onPress={() => Linking.openURL("https://chat.whatsapp.com/PON_AQUI_TU_ENLACE")} 
            >
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              <Text style={styles.textoBotonMinimalistaWhatsapp}>ÚNETE AL CHAT DE PILOTOS</Text>
            </TouchableOpacity>

            {/* ENLACE TORNEO PÚBLICO */}
            <TouchableOpacity 
              style={styles.linkContainer} 
              onPress={() => navigation.navigate("TorneoPublicoScreen")}
            >
              <Text style={styles.linkTexto}>Ver cuadrante público del torneo →</Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fondoDegradado: { flex: 1, width: '100%', height: '100%' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  
  card: { 
    backgroundColor: 'rgba(12, 12, 15, 0.85)', // Oscuro, muy elegante
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
  
  // LOGO TOP (ya no se usa, pero lo dejamos limpio)
  logoContainerTop: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEscudo: {
    width: 280,
    height: 95,
  },

  // HEADER CARD: título + línea + subtítulo
  headerCard: { 
    alignItems: "center", 
    marginBottom: 20, 
    paddingBottom: 10,
    width: '100%',
  },
  tituloCard: {
    fontSize: 28, 
    fontWeight: "900", 
    color: "#fff", 
    fontStyle: "italic", 
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'AwesomeSunday',
  },
  lineaSeparadora: {
    width: '100%',
    height: 8,
    marginTop: 12,
    marginBottom: 12,
    opacity: 0.9,
  },
  
  subtitulo: { 
    fontSize: 12, 
    color: '#e1e1e1', // 🤍 Cambiado a gris clarito elegante
    fontWeight: "bold", 
    letterSpacing: 4, 
    textAlign: 'center',
    marginBottom: 8,
  },
  instrucciones: { 
    color: "rgba(255,255,255,0.6)", 
    textAlign: "center", 
    marginBottom: 20, 
    fontSize: 12, 
    letterSpacing: 0.5,
  },
  
  form: { marginBottom: 20 },
  label: { 
    color: '#e1e1e1', // 🤍 Cambiado a gris clarito
    fontSize: 10, 
    fontWeight: "bold", 
    marginBottom: 5, 
    letterSpacing: 2 
  },
  input: { 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    color: "#fff", 
    borderWidth: 1, 
    borderColor: "rgba(255, 255, 255, 0.1)", 
    padding: 15, 
    marginBottom: 15, 
    borderRadius: 6, 
    fontSize: 14, 
    fontWeight: 'bold',
    borderLeftWidth: 3,
    borderLeftColor: '#68358c', // Borde morado sutil
  },
  
  // 🕹️ BOTONES MINIMALISTAS TIPO PASTILLA
  botonMinimalista: { 
    backgroundColor: 'transparent', // El degradado va dentro, el botón es transparente
    borderRadius: 30, 
    alignItems: "center",
    marginBottom: 10,
    overflow: 'hidden', 
    
    
    ...Platform.select({
      web: {
        // En web quitamos las sombras por completo para evitar el glow morado feo
        shadowColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
      },
      default: {
        // En móvil (nativo) dejamos la sombra morada sutil que sí funciona bien
        shadowColor: "#8b48ba", // Sombra morado Kaizō
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, // Menos opacidad para que sea elegante
        shadowRadius: 8,   // Un radio de difusión moderado
        elevation: 5,       // Para Android nativo
      }
    }),
  },
  linearGradientBoton: {
    width: '100%',
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonDesactivado: { opacity: 0.5 },
  textoBotonMinimalista: { 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "900", 
    letterSpacing: 1.5, 
  },

  botonMinimalistaWhatsapp: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 10,
    borderRadius: 30, 
    marginTop: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: "rgba(37, 211, 102, 0.7)" // Verde menos chillón
  },
  textoBotonMinimalistaWhatsapp: {
    color: "#25D366",
    fontSize: 11, 
    fontWeight: "bold", 
    letterSpacing: 1,
    textAlign: 'center'
  },

  linkContainer: {
    marginTop: 25,
    alignItems: 'center'
  },
  linkTexto: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textDecorationLine: 'underline',
  }
});