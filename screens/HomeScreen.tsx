import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { EstadoJugador } from "../types/entities";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const jugadorId = route.params?.jugadorId;

  const [faseActual, setFaseActual] = useState("Cargando...");
  const [estadoJugador, setEstadoJugador] = useState<EstadoJugador>("inscrito");
  // 🔄 CAMBIO: Ahora guardamos un ARRAY de carreras, no solo una.
  const [misCarreras, setMisCarreras] = useState<any[]>([]);
  const [nombreJugador, setNombreJugador] = useState("");
  const [buscandoCarrera, setBuscandoCarrera] = useState(true);

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

  useEffect(() => {
    const docRef = doc(db, "configuracion", "torneo");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFaseActual(docSnap.data().fase_actual);
      }
    });
    return () => unsubscribe();
  }, []);

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
        // 🔄 CAMBIO: Ordenamos para que la historia vaya de arriba (Clasificatoria) a abajo (Final)
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

  const obtenerMensajeEstado = () => {
    if (faseActual === "clasificatoria" && estadoJugador === "inscrito" && misCarreras.length === 0 && !buscandoCarrera) {
      return { icono: "timer-sand", iconLib: "MaterialCommunityIcons", texto: "EN LISTA DE ESPERA", color: "#e63946" }; 
    }
    switch (estadoJugador) {
      case "inscrito": return { icono: "flag-checkered", iconLib: "MaterialCommunityIcons", texto: "Preparado para Clasificatorias", color: "#4caf50" };
      case "clasificado_semi_a": return { icono: "flame", iconLib: "Ionicons", texto: "¡Clasificado a SEMIFINAL A!", color: "#e63946" };
      case "clasificado_semi_b": return { icono: "flash", iconLib: "Ionicons", texto: "¡Clasificado a SEMIFINAL B!", color: "#f77f00" };
      case "clasificado_final_b": return { icono: "bullseye-arrow", iconLib: "MaterialCommunityIcons", texto: "¡En la FINAL B!", color: "#06ffa5" };
      case "finalista": return { icono: "trophy", iconLib: "MaterialCommunityIcons", texto: "¡ESTÁS EN LA GRAN FINAL!", color: "#ffd700" };
      case "eliminado": return { icono: "emoticon-sad-outline", iconLib: "MaterialCommunityIcons", texto: "Eliminado del torneo", color: "#666" };
      case "ganador": return { icono: "crown", iconLib: "MaterialCommunityIcons", texto: "¡CAMPEÓN DEL TORNEO!", color: "#ffd700" };
      default: return { icono: "help-circle", iconLib: "MaterialCommunityIcons", texto: "Estado desconocido", color: "#aaa" };
    }
  };

  const mensaje = obtenerMensajeEstado();
  const esOverbooking = faseActual === "clasificatoria" && estadoJugador === "inscrito" && misCarreras.length === 0 && !buscandoCarrera;

  if (buscandoCarrera) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#ffd700" />
        <Text style={{ color: '#ffd700', marginTop: 10, fontWeight: 'bold' }}>Buscando tu box...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="garage" size={20} color="#e63946" />
          <Text style={styles.tituloHeader}>TU BOX</Text>
        </View>
        <Text style={styles.nombre}>{nombreJugador.toUpperCase()}</Text>
      </View>

      <View style={styles.tarjetaFase}>
        <Text style={styles.textoGris}>ESTADO GLOBAL DEL TORNEO:</Text>
        <Text style={styles.fase}>
          {faseActual === "clasificatoria" ? "CLASIFICATORIAS"
            : faseActual === "semifinales" ? "SEMIFINALES"
            : faseActual === "final_b" ? "FINAL B"
            : faseActual === "final" ? "GRAN FINAL"
            : faseActual.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      <View style={[styles.tarjetaEstado, { borderColor: mensaje.color }]}>
        {mensaje.iconLib === "MaterialCommunityIcons" ? (
          <MaterialCommunityIcons name={mensaje.icono as any} size={48} color={mensaje.color} style={{ marginBottom: 10 }} />
        ) : (
          <Ionicons name={mensaje.icono as any} size={48} color={mensaje.color} style={{ marginBottom: 10 }} />
        )}
        <Text style={[styles.estadoTexto, { color: mensaje.color }]}>{mensaje.texto}</Text>
      </View>

      {esOverbooking ? (
        <View style={styles.tarjetaListaEspera}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Ionicons name="warning" size={24} color="#e63946" />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>¡Las plazas están llenas!</Text>
          </View>
          <Text style={styles.textoListaEspera}>
            Estás apuntado como <Text style={{fontWeight: 'bold', color: '#fff'}}>reserva</Text>. Presta atención a la megafonía por si algún piloto falla y queda un hueco libre en la parrilla.
          </Text>
        </View>
      ) : null}

      {estadoJugador === "eliminado" ? (
        <View style={styles.tarjetaEliminado}>
          <Text style={styles.textoEliminado}>Gracias por participar.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Text style={styles.textoEliminado}>¡Nos vemos en la próxima edición!</Text>
            <MaterialCommunityIcons name="flag-checkered" size={18} color="#888" />
          </View>
        </View>
      ) : null}

      {estadoJugador === "ganador" ? (
        <View style={styles.tarjetaGanador}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <MaterialCommunityIcons name="trophy" size={32} color="#ffd700" />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffd700' }}>¡FELICIDADES!</Text>
            <MaterialCommunityIcons name="trophy" size={32} color="#ffd700" />
          </View>
          <Text style={styles.textoGanador}>Eres el campeón absoluto del torneo</Text>
        </View>
      ) : null}

      {/* 🏁 ZONA DE HISTORIAL DE CARRERAS */}
      {misCarreras.length > 0 && (
        <View style={{ width: '100%', marginTop: 10 }}>
          <Text style={styles.tituloHistorial}>🏁 TU HISTORIAL DE CARRERAS</Text>
          
          {misCarreras.map((carrera, indexCarrera) => (
            <View key={carrera.id} style={styles.tarjetaCarrera}>
              <View style={styles.cabeceraCarrera}>
                <Text style={styles.tituloCarrera}>{carrera.nombre_carrera}</Text>
                {carrera.estado === "en_curso" ? (
                  <View style={styles.badgeEnCurso}>
                    <Ionicons name="radio-button-on" size={12} color="#e63946" />
                    <Text style={styles.textoBadge}> EN CURSO</Text>
                  </View>
                ) : (
                  <Text style={[styles.subtituloCarrera, carrera.estado === "finalizada" && {color: '#4caf50'}]}>
                    {carrera.estado.toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="time-outline" size={16} color="#ffd700" />
                <Text style={styles.horaCarrera}>
                  {carrera.hora ? `Hora: ${carrera.hora}` : "Hora: Por definir"}
                </Text>
              </View>

              <View style={styles.separador} />

              <Text style={styles.participantesTitulo}>PARRILLA DE SALIDA</Text>
              <View style={styles.participantesContainer}>
                {carrera.participantes?.map((participante: any, index: number) => {
                  const esYo = participante.jugador_id === jugadorId;
                  return (
                    <View key={`${index}-${participante.jugador_id}`} style={[styles.filaParticipante, esYo ? styles.filaYo : null]}>
                      <Text style={[styles.participanteNumero, esYo ? styles.textoYo : null]}>P{index + 1}</Text>
                      <Text style={[styles.participanteNombre, esYo ? styles.textoYo : null]} numberOfLines={1}>
                        {participante.nombre} {esYo ? "(TÚ)" : ""}
                      </Text>
                      {participante.posicion > 0 && participante.posicion !== 99 ? (
                        <Text style={[styles.posicionFinal, participante.posicion === 1 ? {color:'#ffd700'} : null]}>
                          Pº {participante.posicion}
                        </Text>
                      ) : null}
                      {participante.posicion === 99 ? (
                        <Text style={{color:'#e63946', fontWeight:'bold', fontSize:14}}>DNF</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.contenedorBotones}>
        <TouchableOpacity style={styles.botonBracket} onPress={() => navigation.navigate("PantallaGiganteScreen")}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <MaterialCommunityIcons name="tournament" size={22} color="#ffd700" />
            <Text style={styles.textoBotonBracket}>VER BRACKET COMPLETO</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.botonPrincipal} onPress={() => navigation.navigate("TorneoPublicoScreen")}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color="#fff" />
            <Text style={styles.textoBotonPrincipal}>VER CUADRANTE EN VIVO</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.botonSecundario} onPress={() => navigation.replace("Login")}>
          <Text style={styles.textoBotonSecundario}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#121212", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 20, width: "100%", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 15 },
  tituloHeader: { fontSize: 16, fontWeight: "bold", color: "#e63946", letterSpacing: 2 },
  nombre: { fontSize: 26, color: "#fff", fontWeight: "900", fontStyle: "italic", marginTop: 5 },
  tarjetaFase: { width: "100%", padding: 15, backgroundColor: "#1e1e1e", borderRadius: 8, borderWidth: 1, borderColor: "#333", alignItems: "center", marginBottom: 15 },
  textoGris: { fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  fase: { fontSize: 18, fontWeight: "bold", color: "#ffd700" },
  tarjetaEstado: { width: "100%", padding: 20, backgroundColor: "#1a1a1a", borderRadius: 8, borderWidth: 2, alignItems: "center", marginBottom: 15 },
  estadoTexto: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 0.5 },
  tarjetaListaEspera: { width: "100%", padding: 20, backgroundColor: "rgba(230, 57, 70, 0.15)", borderRadius: 8, borderWidth: 2, borderColor: "#e63946", borderStyle: 'dashed', alignItems: "center", marginBottom: 15 },
  textoListaEspera: { fontSize: 15, color: "#ccc", textAlign: "center", lineHeight: 22 },
  tarjetaEliminado: { width: "100%", padding: 30, backgroundColor: "#1a1a1a", borderRadius: 8, borderWidth: 1, borderColor: "#444", alignItems: "center", marginBottom: 15 },
  textoEliminado: { fontSize: 16, color: "#888", textAlign: "center", lineHeight: 24 },
  tarjetaGanador: { width: "100%", padding: 30, backgroundColor: "rgba(255, 215, 0, 0.1)", borderRadius: 8, borderWidth: 2, borderColor: "#ffd700", alignItems: "center", marginBottom: 15 },
  textoGanador: { fontSize: 18, color: "#ffd700", textAlign: "center", fontWeight: "bold", lineHeight: 28 },
  
  // Novedad: Título del historial
  tituloHistorial: { color: '#ffd700', fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15, marginTop: 10, alignSelf: 'flex-start' },
  
  tarjetaCarrera: { width: "100%", padding: 20, backgroundColor: "#1e1e1e", borderRadius: 10, borderWidth: 1, borderColor: "#444", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  cabeceraCarrera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tituloCarrera: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  subtituloCarrera: { fontSize: 12, color: "#888", fontWeight: "bold" },
  badgeEnCurso: { backgroundColor: 'rgba(230, 57, 70, 0.2)', borderColor: '#e63946', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  textoBadge: { color: '#e63946', fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  horaCarrera: { fontSize: 15, color: "#ffd700", fontWeight: "bold", fontStyle: "italic", marginBottom: 15 },
  separador: { height: 1, backgroundColor: "#333", width: "100%", marginBottom: 15 },
  participantesTitulo: { fontSize: 14, fontWeight: "bold", color: "#888", letterSpacing: 1, marginBottom: 10 },
  participantesContainer: { marginTop: 5 },
  filaParticipante: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#2a2a2a", borderRadius: 6, marginBottom: 6 },
  filaYo: { backgroundColor: "rgba(255, 215, 0, 0.15)", borderColor: "#ffd700", borderWidth: 1 },
  participanteNumero: { fontSize: 14, fontWeight: "bold", color: "#666", marginRight: 12, width: 25 },
  participanteNombre: { fontSize: 16, flex: 1, color: "#eee", fontWeight: "500" },
  textoYo: { color: "#ffd700", fontWeight: "900" },
  posicionFinal: { fontSize: 14, color: "#06ffa5", fontWeight: "bold" },
  
  contenedorBotones: { width: "100%", marginTop: 15, marginBottom: 40 },
  botonBracket: { backgroundColor: "#1a1a1a", paddingVertical: 18, borderRadius: 8, alignItems: "center", marginBottom: 15, borderWidth: 2, borderColor: "#ffd700", shadowColor: "#ffd700", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  textoBotonBracket: { color: "#ffd700", fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  botonPrincipal: { backgroundColor: "#2a9d8f", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  textoBotonPrincipal: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  botonSecundario: { backgroundColor: "#1e1e1e", paddingVertical: 15, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#444" },
  textoBotonSecundario: { color: "#888", fontSize: 16, fontWeight: "bold" }
});