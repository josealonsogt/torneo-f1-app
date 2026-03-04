import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { Carrera } from "../types/entities";

export default function TorneoPublicoScreen() {
  const navigation = useNavigation();
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [faseSeleccionada, setFaseSeleccionada] = useState("clasificatoria");

  useEffect(() => {
    const carrerasRef = collection(db, "carreras");
    const unsubscribe = onSnapshot(carrerasRef, (snapshot) => {
      const listaCarreras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Carrera & { id: string })[];

      listaCarreras.sort((a, b) => a.numero - b.numero);
      setCarreras(listaCarreras);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  if (cargando) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.textoCargando}>SINCRONIZANDO TELEMETRÍA...</Text>
      </View>
    );
  }

  const opcionesMenu = [
    { id: "clasificatoria", titulo: "CLASIFICATORIAS" },
    { id: "semifinal_a", titulo: "SEMIFINALES A" },
    { id: "semifinal_b", titulo: "SEMIFINALES B" },
    { id: "final_b", titulo: "FINAL B" },
    { id: "final", titulo: "GRAN FINAL" },
  ];

  const carrerasMostradas = carreras.filter(c => c.fase === faseSeleccionada);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <Text style={styles.textoBotonVolver}>◀ VOLVER</Text>
        </TouchableOpacity>
        <View style={styles.titulosHeader}>
          <Text style={styles.titulo}>MATSURI RACING</Text>
          <Text style={styles.subtitulo}>LIVE TIMING & SCORING</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.menuContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
          {opcionesMenu.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={[styles.pestana, faseSeleccionada === opcion.id ? styles.pestanaActiva : null]}
              onPress={() => setFaseSeleccionada(opcion.id)}
            >
              <Text style={[styles.textoPestana, faseSeleccionada === opcion.id ? styles.textoPestanaActiva : null]}>
                {opcion.titulo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {carrerasMostradas.length === 0 ? (
          <View style={styles.vacioContainer}>
            <Text style={styles.vacio}>[ FASE NO GENERADA ]</Text>
            <Text style={styles.subVacio}>ESPERANDO DATOS DE DIRECCIÓN DE CARRERA</Text>
          </View>
        ) : (
          carrerasMostradas.map((carrera) => (
            <View key={carrera.id} style={styles.tarjeta}>
              <View style={styles.cabeceraTarjeta}>
                <Text style={styles.nombreCarrera}>{carrera.nombre_carrera.toUpperCase()}</Text>
                {carrera.estado === "en_curso" ? (
                  <View style={styles.badgeEnCurso}><Text style={styles.textoBadgeEnCurso}>EN PISTA</Text></View>
                ) : carrera.estado === "finalizada" ? (
                  <View style={styles.badgeFinalizada}><Text style={styles.textoBadgeFinalizada}>FINALIZADA</Text></View>
                ) : (
                  <View style={styles.badgePendiente}><Text style={styles.textoBadgePendiente}>PENDIENTE</Text></View>
                )}
              </View>

              <View style={styles.infoBar}>
                <Text style={styles.horaTexto}>HORA: {carrera.hora ? carrera.hora : "No predefinido"}</Text>
              </View>

              <View style={styles.tablaPilotos}>
                {ordenarParticipantes(carrera.participantes).map((p, index) => {
                  let colorPosicion = "#666";
                  let textoPosicion = "-";
                  
                  if (p.posicion > 0 && p.posicion !== 99) {
                    textoPosicion = `P${p.posicion}`;
                    if (p.posicion === 1) colorPosicion = "#ffd700";
                    else if (p.posicion === 2) colorPosicion = "#c0c0c0";
                    else if (p.posicion === 3) colorPosicion = "#cd7f32";
                    else colorPosicion = "#aaa";
                  } else if (p.posicion === 99) {
                    textoPosicion = "DNF";
                    colorPosicion = "#e63946";
                  } else {
                    textoPosicion = `S${index + 1}`;
                  }

                  return (
                    // 🛡️ PARCHE CLON: Clave única usando jugador_id + índice para que no crashee
                    <View key={`${p.jugador_id}-${index}`} style={styles.filaPiloto}>
                      <Text style={[styles.posicionPiloto, { color: colorPosicion }]}>{textoPosicion}</Text>
                      <Text style={styles.nombrePiloto} numberOfLines={1}>{p.nombre.toUpperCase()}</Text>
                      {p.posicion === 99 ? <Text style={styles.etiquetaOut}>OUT</Text> : null}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  centrado: { justifyContent: "center", alignItems: "center" },
  textoCargando: { color: "#e63946", marginTop: 15, fontWeight: "bold", letterSpacing: 2, fontSize: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  botonVolver: { paddingVertical: 5, paddingRight: 15 },
  textoBotonVolver: { color: "#e63946", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  titulosHeader: { alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: "900", color: "#fff", fontStyle: "italic", letterSpacing: 3 },
  subtitulo: { fontSize: 10, color: "#e63946", fontWeight: "bold", letterSpacing: 4, marginTop: 2 },
  menuContainer: { backgroundColor: '#111', borderBottomWidth: 2, borderBottomColor: '#222' },
  menuScroll: { paddingHorizontal: 10, paddingVertical: 12 },
  pestana: { paddingHorizontal: 15, paddingVertical: 6, marginRight: 15, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  pestanaActiva: { borderBottomColor: '#e63946' },
  textoPestana: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  textoPestanaActiva: { color: '#fff' },
  scrollContainer: { padding: 15, paddingBottom: 40 },
  vacioContainer: { alignItems: 'center', marginTop: 80, padding: 30, borderWidth: 1, borderColor: '#222', backgroundColor: '#111', borderStyle: 'dashed' },
  vacio: { fontSize: 16, fontWeight: 'bold', color: "#555", textAlign: "center", letterSpacing: 2, marginBottom: 5 },
  subVacio: { fontSize: 10, color: "#444", textAlign: "center", letterSpacing: 1 },
  tarjeta: { backgroundColor: "#151515", borderRadius: 4, marginBottom: 20, borderWidth: 1, borderColor: "#222", overflow: 'hidden' },
  cabeceraTarjeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#222' },
  nombreCarrera: { fontSize: 16, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  badgeEnCurso: { backgroundColor: 'rgba(230, 57, 70, 0.1)', borderWidth: 1, borderColor: '#e63946', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  textoBadgeEnCurso: { color: '#e63946', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  badgeFinalizada: { backgroundColor: 'rgba(42, 157, 143, 0.1)', borderWidth: 1, borderColor: '#2a9d8f', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  textoBadgeFinalizada: { color: '#2a9d8f', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  badgePendiente: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  textoBadgePendiente: { color: '#888', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  infoBar: { backgroundColor: '#111', paddingHorizontal: 15, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  horaTexto: { color: '#ffd700', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  tablaPilotos: { padding: 10 },
  filaPiloto: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  posicionPiloto: { width: 40, fontSize: 14, fontWeight: "900", textAlign: 'center', letterSpacing: 1 },
  nombrePiloto: { flex: 1, color: "#ddd", fontSize: 14, fontWeight: "bold", marginLeft: 10, letterSpacing: 0.5 },
  etiquetaOut: { color: '#e63946', fontSize: 10, fontWeight: '900', letterSpacing: 1, backgroundColor: '#222', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  textoVacioTabla: { color: "#444", fontSize: 12, textAlign: "center", paddingVertical: 15, fontWeight: 'bold', letterSpacing: 1 },
});