import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// CEREBRO DEL TORNEO
import { TorneoConfig } from "../../config/torneoConfig";
import { db } from "../../services/firebaseConfig";
import { EstadoJugador } from "../../types/entities";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const jugadorId = route.params?.jugadorId;

  //  ESTADOS DE LA PANTALLA
  const [faseActual, setFaseActual] = useState("Cargando...");
  const [estadoJugador, setEstadoJugador] = useState<EstadoJugador>("inscrito");
  const [misCarreras, setMisCarreras] = useState<any[]>([]);
  const [nombreJugador, setNombreJugador] = useState("");
  const [buscandoCarrera, setBuscandoCarrera] = useState(true);

  //  Elimina la barra blanca superior nativa
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // LISTENER: Datos del Jugador
  useEffect(() => {
    if (!jugadorId) return;
    const jugadorRef = doc(db, "jugadores", jugadorId);
    const unsubscribe = onSnapshot(jugadorRef, (docSnap) => {
      if (docSnap.exists()) {
        const datos = docSnap.data();
        setEstadoJugador(datos.estado_torneo);
        setNombreJugador(datos.nombre);
      }
    });
    return () => unsubscribe();
  }, [jugadorId]);

  // LISTENER: Fase Global del Torneo
  useEffect(() => {
    const docRef = doc(db, "configuracion", "torneo");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setFaseActual(docSnap.data().fase_actual);
    });
    return () => unsubscribe();
  }, []);

  // LISTENER: Historial de Carreras del Jugador
  useEffect(() => {
    if (!jugadorId) return;
    const carrerasRef = collection(db, "carreras");
    const unsubscribe = onSnapshot(carrerasRef, (snapshot) => {
      let misCarrerasEncontradas: any[] = [];
      snapshot.forEach((docSnap) => {
        const carrera = { id: docSnap.id, ...docSnap.data() } as any; 
        if (carrera.participantes && Array.isArray(carrera.participantes)) {
          const esta = carrera.participantes.some((p: any) => p && p.jugador_id === jugadorId);
          if (esta) misCarrerasEncontradas.push(carrera);
        }
      });
      
      if (misCarrerasEncontradas.length > 0) {
        const pesos: any = { clasificatoria: 1, semifinal_a: 2, semifinal_b: 2, final_b: 3, final: 4 };
        misCarrerasEncontradas.sort((a, b) => pesos[a.fase] - pesos[b.fase]);
        setMisCarreras(misCarrerasEncontradas);
      } else {
        setMisCarreras([]);
      }
      setBuscandoCarrera(false); 
    });
    return () => unsubscribe();
  }, [jugadorId]);

  // 🎨 LÓGICA DE COLORES POR ESTADO (Usando el Config donde aplica)
  const obtenerMensajeEstado = () => {
    if (faseActual === "clasificatoria" && estadoJugador === "inscrito" && misCarreras.length === 0 && !buscandoCarrera) {
      return { icono: "timer-sand", iconLib: "MaterialCommunityIcons", texto: "EN LISTA DE ESPERA", color: TorneoConfig.colores.secundario }; 
    }
    switch (estadoJugador) {
      case "inscrito": return { icono: "flag-checkered", iconLib: "MaterialCommunityIcons", texto: "LISTO PARA CLASIFICAR", color: "#25D366" }; 
      case "clasificado_semi_a": return { icono: "flame", iconLib: "Ionicons", texto: "¡A SEMIFINAL A!", color: TorneoConfig.colores.primario }; 
      case "clasificado_semi_b": return { icono: "flash", iconLib: "Ionicons", texto: "¡A SEMIFINAL B!", color: TorneoConfig.colores.primario };
      case "clasificado_final_b": return { icono: "bullseye-arrow", iconLib: "MaterialCommunityIcons", texto: "¡A LA FINAL B!", color: TorneoConfig.colores.acento }; 
      case "finalista": return { icono: "trophy", iconLib: "MaterialCommunityIcons", texto: "¡ESTÁS EN LA FINAL!", color: "#ffd700" };
      case "eliminado": return { icono: "emoticon-sad-outline", iconLib: "MaterialCommunityIcons", texto: "ELIMINADO DEL TORNEO", color: "#888" };
      case "ganador": return { icono: "crown", iconLib: "MaterialCommunityIcons", texto: "¡CAMPEÓN ABSOLUTO!", color: "#ffd700" };
      default: return { icono: "help-circle", iconLib: "MaterialCommunityIcons", texto: "ESTADO DESCONOCIDO", color: "#aaa" };
    }
  };

  const mensaje = obtenerMensajeEstado();
  const esOverbooking = faseActual === "clasificatoria" && estadoJugador === "inscrito" && misCarreras.length === 0 && !buscandoCarrera;

  // ⏳ PANTALLA DE CARGA
  if (buscandoCarrera) {
    return (
      <LinearGradient colors={TorneoConfig.colores.fondoGradiente as any} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={TorneoConfig.colores.primario} />
        <Text style={{ color: '#fff', marginTop: 15, fontWeight: 'bold', letterSpacing: 2 }}>BUSCANDO TU BOX...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={TorneoConfig.colores.fondoGradiente as any}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/*  HEADER */}
        <View style={styles.headerBox}>
          <Text style={styles.nombreJugador}>{nombreJugador.toUpperCase()}</Text>
          <Image source={require('../../assets/Recurso 6recursos.png')} style={styles.lineaSeparadora} resizeMode="cover"/>
          <Text style={styles.tituloHeader}>PANEL DE PILOTO</Text>
        </View>

        {/*  PANEL DE ESTADO GLOBAL */}
        <View style={styles.tarjetaCristal}>
          <View style={styles.filaEstado}>
            <View style={{flex: 1}}>
              <Text style={styles.labelGris}>FASE ACTUAL:</Text>
              <Text style={styles.textoFase}>
                {faseActual === "clasificatoria" ? "CLASIFICATORIAS"
                  : faseActual === "semifinales" ? "SEMIFINALES"
                  : faseActual === "final_b" ? "FINAL B"
                  : faseActual === "final" ? "GRAN FINAL"
                  : faseActual.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.bordeLateral, { backgroundColor: mensaje.color }]} />
            <View style={{flex: 1.5, alignItems: 'flex-end'}}>
              <Text style={styles.labelGris}>TU ESTADO:</Text>
              <Text style={[styles.textoEstadoPersonal, { color: mensaje.color }]}>{mensaje.texto}</Text>
            </View>
          </View>
        </View>

        {/*  AVISOS (Lista de espera, Eliminado, Ganador) */}
        {esOverbooking && (
          <View style={[styles.tarjetaCristal, styles.tarjetaAviso]}>
            <View style={styles.filaAviso}>
              <Ionicons name="warning" size={28} color={TorneoConfig.colores.secundario} />
              <Text style={styles.tituloAviso}>¡PARRILLA LLENA!</Text>
            </View>
            <Text style={styles.textoAviso}>
              Estás en <Text style={{color: '#fff', fontWeight: 'bold'}}>reserva</Text>. Atento a megafonía por si falla algún piloto.
            </Text>
          </View>
        )}

        {estadoJugador === "eliminado" && (
          <View style={[styles.tarjetaCristal, { opacity: 0.8 }]}>
            <Text style={styles.textoAviso}>Gracias por participar.</Text>
            <Text style={[styles.textoAviso, {marginTop: 5}]}>¡Nos vemos en la próxima edición! 🏁</Text>
          </View>
        )}

        {estadoJugador === "ganador" && (
          <View style={[styles.tarjetaCristal, { borderColor: '#ffd700', borderWidth: 2 }]}>
            <View style={styles.filaAviso}>
              <MaterialCommunityIcons name="trophy" size={32} color="#ffd700" />
              <Text style={[styles.tituloAvisoGanador]}>¡CAMPEÓN!</Text>
              <MaterialCommunityIcons name="trophy" size={32} color="#ffd700" />
            </View>
          </View>
        )}

        {/*  HISTORIAL DE CARRERAS */}
        {misCarreras.length > 0 && (
          <View style={styles.seccionHistorial}>
            <Text style={styles.tituloSeccion}>HISTORIAL DE CARRERAS</Text>
            
            {misCarreras.map((carrera) => (
              <View key={carrera.id} style={styles.tarjetaCarrera}>
                
                <View style={styles.cabeceraCarrera}>
                  <View>
                    <Text style={styles.nombreCarrera}>{carrera.nombre_carrera}</Text>
                    <Text style={styles.horaCarrera}>
                      <Ionicons name="time-outline" size={12} /> {carrera.hora ? carrera.hora : "Por definir"}
                    </Text>
                  </View>
                  
                  {carrera.estado === "en_curso" ? (
                    <View style={styles.badgeEnCurso}>
                      <View style={styles.puntoRojo} />
                      <Text style={styles.textoBadge}>EN PISTA</Text>
                    </View>
                  ) : (
                    <Text style={[styles.estadoBadgeFinalizada, carrera.estado === "finalizada" && {color: TorneoConfig.colores.primario}]}>
                      {carrera.estado.toUpperCase()}
                    </Text>
                  )}
                </View>

                <View style={styles.parrillaContainer}>
                  {carrera.participantes?.map((participante: any, index: number) => {
                    const esYo = participante.jugador_id === jugadorId;
                    
                    let colorPuesto = TorneoConfig.colores.acento; // Cyan por defecto
                    if (participante.posicion === 1) colorPuesto = '#ffd700'; // Oro
                    else if (participante.posicion === 2) colorPuesto = '#c0c0c0'; // Plata

                    return (
                      <View key={`${index}-${participante.jugador_id}`} style={[styles.filaPiloto, esYo && styles.filaPilotoYo]}>
                        <Text style={[styles.numeroPiloto, esYo && styles.textoYo]}>P{index + 1}</Text>
                        <Text style={[styles.nombrePiloto, esYo && styles.textoYo]} numberOfLines={1}>
                          {participante.nombre} {esYo ? "(TÚ)" : ""}
                        </Text>
                        
                        {participante.posicion > 0 && participante.posicion !== 99 && (
                          <Text style={[styles.posicionFinal, { color: colorPuesto }]}>
                            Pº {participante.posicion}
                          </Text>
                        )}
                        {participante.posicion === 99 && (
                          <View style={styles.badgeDNF}><Text style={styles.textoDNF}>DNF</Text></View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 🕹️ BOTONES DE ACCIÓN */}
        <View style={styles.botonesContainer}>
          <TouchableOpacity style={styles.botonMinimalista} onPress={() => navigation.navigate("PantallaGiganteScreen")}>
            <LinearGradient
              colors={[TorneoConfig.colores.primario, TorneoConfig.colores.primarioOscuro]} 
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              style={styles.linearGradientBoton}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="tournament" size={20} color="#fff" />
                <Text style={styles.textoBotonMinimalista}>VER BRACKET COMPLETO</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.botonMinimalistaOutline} onPress={() => navigation.navigate("TorneoPublicoScreen")}>
             <MaterialCommunityIcons name="trophy-outline" size={18} color="#e1e1e1" />
             <Text style={styles.textoBotonOutline}>VER CUADRANTE EN VIVO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonWhatsappSutil} onPress={() => Linking.openURL(TorneoConfig.whatsappGrupo)}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.textoSutilWhatsapp}>Únete al chat oficial de pilotos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.replace("Login")} style={{marginTop: 15, marginBottom: 30}}>
            <Text style={styles.textoCerrarSesion}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* 🏁 FOOTER CORPORATIVO (Negro puro) */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerTextoTop}>ORGANIZADO POR</Text>
          
          <View style={styles.footerLogos}>
            <Image source={require('../../assets/Logo Kaizo Sim blanco.png')} style={styles.logoFooter} resizeMode="contain" />
            <View style={styles.separadorFooter} />
            <Image source={require('../../assets/logo_toledo_matsuri_2026.png')} style={styles.logoFooter} resizeMode="contain" />
          </View>
          
          <Text style={styles.footerDescripcion}>
            Kaizō Sim es tu centro de alto rendimiento de SimRacing. Únete a nuestra comunidad y lleva tu pilotaje al siguiente nivel.
          </Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

// ==========================================
//  HOJA DE ESTILOS
// ==========================================
const styles = StyleSheet.create({
  // CONTENEDORES
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1, padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  
  // HEADER
  headerBox: { alignItems: 'center', marginBottom: 30, width: '100%' },
  nombreJugador: { fontSize: 38, color: '#fff', fontWeight: '900', fontStyle: 'italic', letterSpacing: 2, textAlign: 'center' },
  lineaSeparadora: { width: '100%', height: 12, marginTop: 5, marginBottom: 10 },
  tituloHeader: { fontSize: 10, color: '#aaa', fontWeight: 'bold', letterSpacing: 6 },

  // TARJETAS CRISTAL
  tarjetaCristal: { backgroundColor: 'rgba(12, 12, 15, 0.75)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', padding: 20, marginBottom: 15 },
  filaEstado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bordeLateral: { width: 2, height: '100%', marginHorizontal: 15, borderRadius: 2 },
  labelGris: { fontSize: 10, color: '#aaa', fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 4 },
  textoFase: { fontSize: 16, color: '#e1e1e1', fontWeight: '900', letterSpacing: 1 },
  textoEstadoPersonal: { fontSize: 14, fontWeight: '900', textAlign: 'right' },

  // AVISOS
  tarjetaAviso: { borderColor: 'rgba(230, 57, 70, 0.5)', backgroundColor: 'rgba(230, 57, 70, 0.1)' },
  filaAviso: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  tituloAviso: { fontSize: 18, fontWeight: '900', color: TorneoConfig.colores.secundario, letterSpacing: 1 },
  tituloAvisoGanador: { color: '#ffd700', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  textoAviso: { fontSize: 13, color: '#ddd', textAlign: 'center', lineHeight: 20 },

  // HISTORIAL DE CARRERAS
  seccionHistorial: { marginTop: 10, marginBottom: 20 },
  tituloSeccion: { fontSize: 14, color: '#e1e1e1', fontWeight: 'bold', letterSpacing: 3, marginBottom: 15 },
  tarjetaCarrera: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 15, overflow: 'hidden' },
  cabeceraCarrera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  nombreCarrera: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  horaCarrera: { fontSize: 11, color: '#aaa', marginTop: 4, fontWeight: 'bold' },
  
  // BADGES
  badgeEnCurso: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(230, 57, 70, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: TorneoConfig.colores.secundario, gap: 5 },
  puntoRojo: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  textoBadge: { fontSize: 10, color: TorneoConfig.colores.secundario, fontWeight: '900', letterSpacing: 1 },
  estadoBadgeFinalizada: { fontSize: 11, color: '#555', fontWeight: 'bold', letterSpacing: 1 },
  
  // PARRILLA
  parrillaContainer: { padding: 10 },
  filaPiloto: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.03)' },
  filaPilotoYo: { backgroundColor: 'rgba(104, 53, 140, 0.3)', borderRadius: 6, borderLeftWidth: 3, borderLeftColor: TorneoConfig.colores.primario },
  numeroPiloto: { width: 30, fontSize: 12, color: '#666', fontWeight: 'bold' },
  nombrePiloto: { flex: 1, fontSize: 14, color: '#ccc', fontWeight: '600' },
  textoYo: { color: '#fff', fontWeight: '900' },
  posicionFinal: { fontSize: 14, fontWeight: '900' },
  badgeDNF: { backgroundColor: TorneoConfig.colores.secundario, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  textoDNF: { fontSize: 10, color: '#fff', fontWeight: 'bold' },

  // BOTONES INFERIORES
  botonesContainer: { marginTop: 10, alignItems: 'center' },
  botonMinimalista: { width: '100%', backgroundColor: 'transparent', borderRadius: 30, marginBottom: 12, overflow: 'hidden' },
  linearGradientBoton: { width: '100%', paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  textoBotonMinimalista: { color: "#fff", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  botonMinimalistaOutline: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(0, 0, 0, 0.4)', marginBottom: 20 },
  textoBotonOutline: { color: '#e1e1e1', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  botonWhatsappSutil: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  textoSutilWhatsapp: { color: '#25D366', fontSize: 12, textDecorationLine: 'underline', fontWeight: 'bold' },
  textoCerrarSesion: { color: '#666', fontSize: 12, textDecorationLine: 'underline' },

  // FOOTER CORPORATIVO
  footerContainer: { backgroundColor: '#000000', paddingVertical: 20, paddingHorizontal: 15, alignItems: 'center', borderTopWidth: 1, borderColor: '#222', marginHorizontal: -20, marginBottom: -20, paddingBottom: 40 },
  footerTextoTop: { color: '#555', fontSize: 10, fontWeight: 'bold', letterSpacing: 3, marginBottom: 15 },
  footerLogos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 30, marginBottom: 15 },
  logoFooter: { flex: 1, height: '100%', opacity: 0.8 },
  separadorFooter: { width: 1, height: '80%', backgroundColor: '#333', marginHorizontal: 15 },
  footerDescripcion: { color: '#444', fontSize: 10, textAlign: 'center', lineHeight: 16, paddingHorizontal: 20 }
});