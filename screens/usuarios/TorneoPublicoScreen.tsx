import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🧠 CEREBRO DEL TORNEO
import { TorneoConfig } from "../../config/torneoConfig";
import { db } from "../../services/firebaseConfig";
import { Carrera } from "../../types/entities";

export default function TorneoPublicoScreen() {
  const navigation = useNavigation();
  
  // 💾 ESTADOS
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [faseSeleccionada, setFaseSeleccionada] = useState("clasificatoria");

  // 🚫 Elimina la barra blanca superior nativa
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // 📡 LISTENER: Sincronización de carreras en tiempo real
  useEffect(() => {
    const carrerasRef = collection(db, "carreras");
    const unsubscribe = onSnapshot(carrerasRef, (snapshot) => {
      const listaCarreras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Carrera & { id: string })[];

      // Ordenar por número de carrera (Carrera 1, Carrera 2...)
      listaCarreras.sort((a, b) => a.numero - b.numero);
      setCarreras(listaCarreras);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  // ⏳ PANTALLA DE CARGA
  if (cargando) {
    return (
      <LinearGradient colors={TorneoConfig.colores.fondoGradiente as any} style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={TorneoConfig.colores.primario} />
        <Text style={styles.textoCargando}>SINCRONIZANDO TELEMETRÍA...</Text>
      </LinearGradient>
    );
  }

  // 🗂️ CONFIGURACIÓN DEL MENÚ DE FASES
  const opcionesMenu = [
    { id: "clasificatoria", titulo: "CLASIFICATORIAS" },
    { id: "semifinal_a", titulo: "SEMIFINALES A" },
    { id: "semifinal_b", titulo: "SEMIFINALES B" },
    { id: "final_b", titulo: "FINAL B" },
    { id: "final", titulo: "GRAN FINAL" },
  ];

  // Filtramos las carreras para mostrar solo las de la pestaña seleccionada
  const carrerasMostradas = carreras.filter(c => c.fase === faseSeleccionada);

  // 🥇 FUNCIÓN: Ordenar pilotos por posición en tiempo real
  const ordenarParticipantes = (participantes: any[]) => {
    if (!participantes) return [];
    return [...participantes].sort((a, b) => {
      if (a.posicion === 0 && b.posicion === 0) return 0;
      if (a.posicion === 0) return 1;
      if (b.posicion === 0) return -1;
      return a.posicion - b.posicion;
    });
  };

  return (
    <LinearGradient
      colors={TorneoConfig.colores.fondoGradiente as any}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}}>
        
        {/* 👑 HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#e1e1e1" />
            <Text style={styles.textoBotonVolver}>BOX</Text>
          </TouchableOpacity>
          
          <View style={styles.titulosHeader}>
            <Image source={require('../../assets/Logo Kaizo Sim blanco.png')} style={styles.logoPequeño} resizeMode="contain" />
            <Text style={[styles.subtitulo, { color: TorneoConfig.colores.acento }]}>LIVE TIMING</Text>
          </View>
          
          <View style={{ width: 60 }} />
        </View>

        {/* 🗂️ MENÚ DE FASES (Scroll Horizontal) */}
        <View style={styles.menuContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
            {opcionesMenu.map((opcion) => {
              const isActive = faseSeleccionada === opcion.id;
              return (
                <TouchableOpacity
                  key={opcion.id}
                  style={[
                    styles.pestana, 
                    isActive && { borderColor: TorneoConfig.colores.primario, backgroundColor: 'rgba(255,255,255,0.1)' }
                  ]}
                  onPress={() => setFaseSeleccionada(opcion.id)}
                >
                  <Text style={[styles.textoPestana, isActive && styles.textoPestanaActiva]}>
                    {opcion.titulo}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* 🏁 ZONA DE TARJETAS DE CARRERA */}
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {carrerasMostradas.length === 0 ? (
            <View style={styles.vacioContainer}>
              <Ionicons name="timer-outline" size={40} color="#666" style={{marginBottom: 10}}/>
              <Text style={styles.vacio}>[ FASE NO GENERADA ]</Text>
              <Text style={styles.subVacio}>Esperando datos de dirección de carrera</Text>
            </View>
          ) : (
            carrerasMostradas.map((carrera) => (
              <View key={carrera.id} style={styles.tarjetaCristal}>
                
                {/* --- Cabecera de la Carrera --- */}
                <View style={styles.cabeceraTarjeta}>
                  <Text style={styles.nombreCarrera}>{carrera.nombre_carrera.toUpperCase()}</Text>
                  
                  {carrera.estado === "en_curso" ? (
                    <View style={[styles.badgeEnCurso, { borderColor: TorneoConfig.colores.secundario }]}>
                      <View style={styles.puntoRojo} />
                      <Text style={[styles.textoBadgeEnCurso, { color: TorneoConfig.colores.secundario }]}>EN PISTA</Text>
                    </View>
                  ) : carrera.estado === "finalizada" ? (
                    <Text style={[styles.textoBadgeFinalizada, { color: TorneoConfig.colores.primario }]}>FINALIZADA</Text>
                  ) : (
                    <Text style={styles.textoBadgePendiente}>PENDIENTE</Text>
                  )}
                </View>

                {/* --- Barra de Información (Hora) --- */}
                <View style={styles.infoBar}>
                  <Ionicons name="time-outline" size={14} color={TorneoConfig.colores.primario} />
                  <Text style={[styles.horaTexto, { color: TorneoConfig.colores.primario }]}>
                    {carrera.hora ? carrera.hora : "Por definir"}
                  </Text>
                </View>

                {/* --- Tabla de Pilotos --- */}
                <View style={styles.tablaPilotos}>
                  {ordenarParticipantes(carrera.participantes).map((p, index) => {
                    
                    // 🥇 Lógica de Colores de Posición
                    let colorPosicion = TorneoConfig.colores.acento; // Por defecto (Cyan)
                    let textoPosicion = `P${index + 1}`;
                    let mostrarTrofeo = false;
                    let esDNF = false;
                    
                    if (p.posicion > 0 && p.posicion !== 99) {
                      textoPosicion = `Pº ${p.posicion}`;
                      // El Oro, Plata y Bronce no los metemos en config porque son universales del deporte
                      if (p.posicion === 1) { colorPosicion = "#ffd700"; mostrarTrofeo = true; } // Oro
                      else if (p.posicion === 2) { colorPosicion = "#c0c0c0"; mostrarTrofeo = true; } // Plata
                      else if (p.posicion === 3) { colorPosicion = "#cd7f32"; } // Bronce
                    } else if (p.posicion === 99) {
                      textoPosicion = "DNF";
                      colorPosicion = TorneoConfig.colores.secundario; // Rojo DNF
                      esDNF = true;
                    }

                    return (
                      <View key={`${p.jugador_id}-${index}`} style={styles.filaPiloto}>
                        <View style={styles.cajaPosicion}>
                          {mostrarTrofeo && <Ionicons name="trophy" size={12} color={colorPosicion} style={{marginRight: 4}}/>}
                          <Text style={[styles.posicionPiloto, { color: colorPosicion }]}>{textoPosicion}</Text>
                        </View>
                        
                        <Text style={[styles.nombrePiloto, esDNF && {color: '#666', textDecorationLine: 'line-through'}]} numberOfLines={1}>
                          {p.nombre.toUpperCase()}
                        </Text>
                        
                        {esDNF ? (
                          <View style={[styles.badgeDNF, { backgroundColor: TorneoConfig.colores.secundario }]}>
                            <Text style={styles.textoDNF}>OUT</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                  
                  {(!carrera.participantes || carrera.participantes.length === 0) ? (
                    <Text style={styles.textoVacioTabla}>SIN PILOTOS ASIGNADOS</Text>
                  ) : null}
                </View>

              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ==========================================
// 🎨 HOJA DE ESTILOS
// ==========================================
const styles = StyleSheet.create({
  // CONTENEDORES GLOBALES
  container: { flex: 1 },
  centrado: { justifyContent: "center", alignItems: "center" },
  textoCargando: { color: "#fff", marginTop: 15, fontWeight: "bold", letterSpacing: 2, fontSize: 12 },
  
  // HEADER
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15,
  },
  botonVolver: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, width: 80 },
  textoBotonVolver: { color: "#e1e1e1", fontWeight: "bold", fontSize: 12, letterSpacing: 1 },
  titulosHeader: { alignItems: 'center' },
  logoPequeño: { width: 100, height: 25, marginBottom: 2 },
  subtitulo: { fontSize: 10, fontWeight: "bold", letterSpacing: 4 },
  
  // MENÚ DE FASES
  menuContainer: { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  menuScroll: { paddingHorizontal: 10, paddingVertical: 10 },
  pestana: { 
    paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, 
    borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'transparent'
  },
  textoPestana: { color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  textoPestanaActiva: { color: '#fff' },
  
  // SCROLL PRINCIPAL Y ESTADOS VACÍOS
  scrollContainer: { padding: 15, paddingBottom: 60 },
  vacioContainer: { 
    alignItems: 'center', marginTop: 80, padding: 40, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderStyle: 'dashed' 
  },
  vacio: { fontSize: 16, fontWeight: 'bold', color: "#888", textAlign: "center", letterSpacing: 2, marginBottom: 5 },
  subVacio: { fontSize: 12, color: "#555", textAlign: "center", letterSpacing: 1 },
  
  // TARJETAS CRISTAL (Glassmorphism)
  tarjetaCristal: {
    backgroundColor: 'rgba(12, 12, 15, 0.8)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20, overflow: 'hidden',
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
  },
  cabeceraTarjeta: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' 
  },
  nombreCarrera: { fontSize: 16, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  
  // BADGES DE ESTADO
  badgeEnCurso: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, gap: 5 
  },
  puntoRojo: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  textoBadgeEnCurso: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  textoBadgeFinalizada: { fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  textoBadgePendiente: { color: '#666', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  
  // INFO BAR (Hora)
  infoBar: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    paddingHorizontal: 15, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.02)' 
  },
  horaTexto: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  
  // TABLA DE PILOTOS
  tablaPilotos: { padding: 10 },
  filaPiloto: { 
    flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 10, 
    borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.03)" 
  },
  cajaPosicion: { flexDirection: 'row', alignItems: 'center', width: 65 }, // Fija el ancho para alinear los nombres
  posicionPiloto: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  nombrePiloto: { flex: 1, color: "#e1e1e1", fontSize: 14, fontWeight: "bold", marginLeft: 5, letterSpacing: 0.5 },
  
  badgeDNF: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  textoDNF: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  textoVacioTabla: { color: "#666", fontSize: 12, textAlign: "center", paddingVertical: 20, fontWeight: 'bold', letterSpacing: 1 },
});