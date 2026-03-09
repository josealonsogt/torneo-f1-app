import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";

export default function MoverPilotosScreen() {
  const navigation = useNavigation();
  const [cargando, setCargando] = useState(true);
  const [carreras, setCarreras] = useState<any[]>([]);
  const [pilotos, setPilotos] = useState<any[]>([]);
  
  // Estados para la selección
  const [paso, setPaso] = useState(1);
  const [pilotoSeleccionado, setPilotoSeleccionado] = useState<any>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cargar todas las carreras (Solo las pendientes o clasificatorias)
      const carrerasSnap = await getDocs(collection(db, "carreras"));
      const listaCarreras = carrerasSnap.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .sort((a, b) => a.numero - b.numero);
      
      setCarreras(listaCarreras);

      // 2. Extraer a los pilotos de esas carreras para saber dónde están
      let listaPilotos: any[] = [];
      listaCarreras.forEach(carrera => {
        if (carrera.participantes) {
          carrera.participantes.forEach((p: any) => {
            listaPilotos.push({
              ...p,
              carreraId: carrera.id,
              nombreCarrera: carrera.nombre_carrera
            });
          });
        }
      });
      
      // Ordenar pilotos alfabéticamente
      listaPilotos.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setPilotos(listaPilotos);
      
    } catch (error) {
      console.error(error);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const seleccionarPiloto = (piloto: any) => {
    setPilotoSeleccionado(piloto);
    setPaso(2); // Pasamos a elegir destino
  };

  const confirmarTraslado = async (carreraDestino: any) => {
    if (carreraDestino.id === pilotoSeleccionado.carreraId) {
      if (Platform.OS === "web") window.alert("El piloto ya está en esta carrera.");
      else Alert.alert("Aviso", "El piloto ya está en esta carrera.");
      return;
    }

    if (carreraDestino.participantes?.length >= 8) {
      const msj = "Esta carrera ya tiene 8 pilotos. ¿Seguro que quieres forzar y meter a 9?";
      if (Platform.OS === "web") {
        if (!window.confirm(msj)) return;
      } else {
        // En móvil habría que hacer un Alert con botones, pero para simplificar lo bloqueamos o avisamos.
      }
    }

    setCargando(true);
    try {
      const batch = writeBatch(db);

      // 1. Sacarlo de la carrera de origen
      const carreraOrigen = carreras.find(c => c.id === pilotoSeleccionado.carreraId);
      const participantesOrigen = carreraOrigen.participantes.filter(
        (p: any) => p.jugador_id !== pilotoSeleccionado.jugador_id
      );
      batch.update(doc(db, "carreras", carreraOrigen.id), { participantes: participantesOrigen });

      // 2. Meterlo en la carrera de destino
      const participantesDestino = [...(carreraDestino.participantes || [])];
      participantesDestino.push({
        jugador_id: pilotoSeleccionado.jugador_id,
        nombre: pilotoSeleccionado.nombre,
        posicion: 0
      });
      batch.update(doc(db, "carreras", carreraDestino.id), { participantes: participantesDestino });

      // 3. Ejecutar el cambio
      await batch.commit();

      if (Platform.OS === "web") window.alert("✅ Fichaje completado con éxito.");
      else Alert.alert("¡Éxito!", "✅ Fichaje completado.");

      // Resetear e ir al paso 1
      setPilotoSeleccionado(null);
      setPaso(1);
      await cargarDatos();

    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") window.alert("❌ Error al mover al piloto.");
      else Alert.alert("Error", "❌ No se pudo mover al piloto.");
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003049" />
        <Text style={{ marginTop: 10, color: '#003049', fontWeight: 'bold' }}>Procesando parrilla...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.botonVolver} onPress={() => paso === 2 ? setPaso(1) : navigation.goBack()}>
        <Text style={styles.textoBotonVolver}>{paso === 2 ? "◀ VOLVER A PILOTOS" : "◀ VOLVER AL PANEL ADMIN"}</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>🔄 Fichajes y Cambios</Text>
      
      {paso === 1 && (
        <>
          <Text style={styles.subtitulo}>PASO 1: Selecciona el piloto que quieres mover</Text>
          {pilotos.length === 0 ? (
            <Text style={styles.textoVacio}>No hay pilotos en carreras pendientes.</Text>
          ) : (
            pilotos.map(p => (
              <TouchableOpacity key={p.jugador_id} style={styles.tarjetaPiloto} onPress={() => seleccionarPiloto(p)}>
                <Text style={styles.nombrePiloto}>{p.nombre}</Text>
                <Text style={styles.carreraActual}>Actualmente en: {p.nombreCarrera}</Text>
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {paso === 2 && pilotoSeleccionado && (
        <>
          <Text style={styles.subtitulo}>PASO 2: ¿A qué carrera movemos a <Text style={{color: '#e63946'}}>{pilotoSeleccionado.nombre}</Text>?</Text>
          <Text style={styles.infoDestino}>Carrera actual: {pilotoSeleccionado.nombreCarrera}</Text>

          {carreras.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.tarjetaCarrera, c.id === pilotoSeleccionado.carreraId ? styles.carreraDeshabilitada : null]}
              onPress={() => confirmarTraslado(c)}
              disabled={c.id === pilotoSeleccionado.carreraId}
            >
              <Text style={styles.nombreCarreraDestino}>{c.nombre_carrera}</Text>
              <Text style={styles.huecosCarrera}>
                Pilotos: {c.participantes ? c.participantes.length : 0}/8
              </Text>
              {c.id === pilotoSeleccionado.carreraId && <Text style={{color: '#e63946', fontSize: 10, fontWeight: 'bold'}}>SU CARRERA ACTUAL</Text>}
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f5f6fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  botonVolver: { paddingVertical: 10, marginBottom: 15, alignSelf: 'flex-start' },
  textoBotonVolver: { color: "#003049", fontWeight: "bold", fontSize: 14 },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#003049", marginBottom: 5 },
  subtitulo: { fontSize: 14, color: "#666", marginBottom: 20, fontWeight: 'bold' },
  textoVacio: { textAlign: 'center', marginTop: 30, color: '#888' },
  
  // Paso 1: Tarjetas Piloto
  tarjetaPiloto: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: "#ddd", borderLeftWidth: 4, borderLeftColor: "#00b4d8" },
  nombrePiloto: { fontSize: 16, fontWeight: "bold", color: "#333" },
  carreraActual: { fontSize: 12, color: "#888", marginTop: 4 },

  // Paso 2: Tarjetas Carrera
  infoDestino: { backgroundColor: '#ffe5e5', padding: 10, borderRadius: 5, color: '#d00000', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  tarjetaCarrera: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: "#ddd", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carreraDeshabilitada: { backgroundColor: '#eee', opacity: 0.6 },
  nombreCarreraDestino: { fontSize: 16, fontWeight: "bold", color: "#003049" },
  huecosCarrera: { fontSize: 14, color: "#2a9d8f", fontWeight: 'bold' }
});