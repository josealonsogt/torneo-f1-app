import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { Carrera } from "../types/entities";

export default function TorneoPublicoScreen() {
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // ✨ NUEVO: Estado para saber qué pestaña estamos viendo
  const [faseSeleccionada, setFaseSeleccionada] = useState("clasificatoria");

  useEffect(() => {
    const carrerasRef = collection(db, "carreras");
    
    const unsubscribe = onSnapshot(carrerasRef, (snapshot) => {
      const listaCarreras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Carrera & { id: string })[];

      // Solo necesitamos ordenar por número porque la fase la filtraremos luego
      listaCarreras.sort((a, b) => a.numero - b.numero);

      setCarreras(listaCarreras);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={{ marginTop: 10, color: "#666" }}>Cargando datos del circuito...</Text>
      </View>
    );
  }

  // Las opciones de nuestro menú de pestañas
  const opcionesMenu = [
    { id: "clasificatoria", titulo: "🏁 Clasificatorias" },
    { id: "semifinal_a", titulo: "🔥 Semis A" },
    { id: "semifinal_b", titulo: "⚡ Semis B" },
    { id: "final_b", titulo: "🎯 Final B" },
    { id: "final", titulo: "🏆 Gran Final" },
  ];

  // Filtramos las carreras para mostrar SOLO las de la pestaña seleccionada
  const carrerasMostradas = carreras.filter(c => c.fase === faseSeleccionada);

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f9" }}>
      
      {/* CABECERA FIJA */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Cuadrante del Torneo</Text>
        <Text style={styles.subtitulo}>Sigue los resultados en directo</Text>
      </View>

      {/* ✨ NUEVO: MENÚ DE PESTAÑAS HORIZONTAL FIJO */}
      <View style={styles.menuContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
          {opcionesMenu.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={[
                styles.pestana,
                faseSeleccionada === opcion.id && styles.pestanaActiva
              ]}
              onPress={() => setFaseSeleccionada(opcion.id)}
            >
              <Text style={[
                styles.textoPestana,
                faseSeleccionada === opcion.id && styles.textoPestanaActiva
              ]}>
                {opcion.titulo}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTA DE CARRERAS (SCROLL) */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {carrerasMostradas.length === 0 ? (
          <View style={styles.vacioContainer}>
            <Text style={styles.emojiVacio}>⏳</Text>
            <Text style={styles.vacio}>Esta fase aún no se ha generado.</Text>
            <Text style={styles.subVacio}>Espera a que terminen las rondas anteriores.</Text>
          </View>
        ) : (
          carrerasMostradas.map((carrera) => (
            <View key={carrera.id} style={[styles.tarjeta, carrera.estado === "finalizada" && styles.tarjetaFinalizada]}>
              
              <View style={styles.cabeceraTarjeta}>
                <Text style={styles.nombreCarrera}>{carrera.nombre_carrera}</Text>
                {carrera.hora ? (
                  <Text style={styles.horaDestacada}>🕒 {carrera.hora}</Text>
                ) : (
                  <Text style={styles.horaGris}>🕒 Por definir</Text>
                )}
              </View>
              
              {/* ESTADO EN CURSO DESTACADO O TEXTO NORMAL */}
              {carrera.estado === "en_curso" ? (
                <View style={styles.enCursoContainer}>
                  <Text style={styles.textoEnCurso}>🔴 CORRIENDO AHORA</Text>
                </View>
              ) : (
                <Text style={styles.estado}>Estado: {carrera.estado.toUpperCase()}</Text>
              )}

              {carrera.estado === "finalizada" ? (
                // --- VISTA DE CARRERA TERMINADA (EL PODIO) ---
                <View style={styles.podioContainer}>
                  <Text style={styles.tituloSeccion}>Resultados Oficiales:</Text>
                  {carrera.participantes
                    .filter(p => p.posicion >= 1 && p.posicion <= 8)
                    .sort((a, b) => a.posicion - b.posicion)
                    .map(p => (
                      <Text key={p.jugador_id} style={p.posicion <= 3 ? styles.textoPodioDestacado : styles.textoPodioNormal}>
                        {p.posicion === 1 ? "🥇" : p.posicion === 2 ? "🥈" : p.posicion === 3 ? "🥉" : `${p.posicion}º`} {p.nombre}
                      </Text>
                    ))}
                </View>
              ) : (
                // --- VISTA DE CARRERA PENDIENTE (LA PARRILLA) ---
                <View style={styles.parrillaContainer}>
                  <Text style={styles.tituloSeccion}>Parrilla de Salida:</Text>
                  <View style={styles.gridPilotos}>
                    {carrera.participantes.map((p, i) => (
                      <Text key={p.jugador_id} style={styles.textoPiloto}>
                        <Text style={{color: '#e63946', fontWeight: 'bold'}}>{i+1}.</Text> {p.nombre}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f9" },
  scrollContainer: { padding: 15, paddingBottom: 40 },
  
  header: { alignItems: "center", backgroundColor: '#003049', paddingTop: 40, paddingBottom: 15, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#fff", textTransform: 'uppercase' },
  subtitulo: { fontSize: 14, color: "#ffb703", marginTop: 5 },
  
  // ✨ ESTILOS DEL MENÚ DE PESTAÑAS
  menuContainer: { backgroundColor: '#fff', paddingVertical: 10, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, zIndex: 10 },
  pestana: { paddingHorizontal: 20, paddingVertical: 8, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#eee' },
  pestanaActiva: { backgroundColor: '#003049' },
  textoPestana: { color: '#666', fontWeight: 'bold', fontSize: 14 },
  textoPestanaActiva: { color: '#fff' },

  vacioContainer: { alignItems: 'center', marginTop: 60 },
  emojiVacio: { fontSize: 50, marginBottom: 15 },
  vacio: { fontSize: 18, fontWeight: 'bold', color: "#333", textAlign: "center" },
  subVacio: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 5 },

  tarjeta: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, borderLeftWidth: 6, borderLeftColor: "#003049" },
  tarjetaFinalizada: { borderLeftColor: "#2a9d8f", backgroundColor: "#f0fdf4" },
  
  cabeceraTarjeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  nombreCarrera: { fontSize: 18, fontWeight: "bold", color: "#003049" },
  
  horaDestacada: { fontSize: 14, fontWeight: "bold", color: "#e63946", backgroundColor: '#ffe5e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  horaGris: { fontSize: 13, fontStyle: 'italic', color: "#666", backgroundColor: '#eee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  
  estado: { fontSize: 12, color: "#666", marginBottom: 5, fontWeight: 'bold' },
  
  enCursoContainer: { backgroundColor: '#ffe5e5', borderColor: '#e63946', borderWidth: 2, padding: 6, borderRadius: 8, marginBottom: 10, alignItems: 'center', alignSelf: 'flex-start' },
  textoEnCurso: { color: '#e63946', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },

  tituloSeccion: { fontWeight: "bold", marginBottom: 8, color: "#333", borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  
  podioContainer: { marginTop: 5 },
  textoPodioDestacado: { fontSize: 16, marginBottom: 4, color: "#000", fontWeight: 'bold' },
  textoPodioNormal: { fontSize: 14, marginBottom: 3, color: "#666", paddingLeft: 22 },
  
  parrillaContainer: { marginTop: 5 },
  gridPilotos: { flexDirection: 'row', flexWrap: 'wrap' },
  textoPiloto: { width: '50%', fontSize: 14, marginBottom: 5, color: "#444" }
});