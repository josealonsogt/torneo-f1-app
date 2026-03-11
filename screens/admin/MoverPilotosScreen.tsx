import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../../services/firebaseConfig";
import { registrarLog } from "../../services/logService";

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
      // 1. Cargar TODAS las carreras
      const carrerasSnap = await getDocs(collection(db, "carreras"));
      const listaCarreras = carrerasSnap.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .sort((a, b) => a.numero - b.numero);
      
      setCarreras(listaCarreras);

      // 2. Crear un "mapa" temporal para saber quién está en qué carrera
      let mapaPilotosCarreras: Record<string, { carreraId: string, nombreCarrera: string }> = {};
      listaCarreras.forEach(carrera => {
        if (carrera.participantes) {
          carrera.participantes.forEach((p: any) => {
            mapaPilotosCarreras[p.jugador_id] = { 
              carreraId: carrera.id, 
              nombreCarrera: carrera.nombre_carrera 
            };
          });
        }
      });

      // 3. 🚨 NUEVO: Cargar TODOS los jugadores inscritos (incluso los reservas)
      const jugadoresSnap = await getDocs(collection(db, "jugadores"));
      const listaTodosLosPilotos = jugadoresSnap.docs.map(d => {
        const idJugador = d.id;
        const datosJugador = d.data();
        
        // Comprobamos en el mapa si este jugador tiene coche
        const infoCarrera = mapaPilotosCarreras[idJugador];

        return {
          jugador_id: idJugador,
          nombre: datosJugador.nombre,
          // Si tiene info de carrera, la ponemos. Si no, es nulo (RESERVA)
          carreraId: infoCarrera ? infoCarrera.carreraId : null,
          nombreCarrera: infoCarrera ? infoCarrera.nombreCarrera : "🚦 EN RESERVA (Sin carrera)"
        };
      });
      
      // Ordenar: Primero los reservas, luego alfabéticamente
      listaTodosLosPilotos.sort((a, b) => {
        if (a.carreraId === null && b.carreraId !== null) return -1;
        if (a.carreraId !== null && b.carreraId === null) return 1;
        return a.nombre.localeCompare(b.nombre);
      });

      setPilotos(listaTodosLosPilotos);
      
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
    if (pilotoSeleccionado.carreraId && carreraDestino.id === pilotoSeleccionado.carreraId) {
      if (Platform.OS === "web") window.alert("ℹ️ YA ESTÁ ASIGNADO\n\nEste piloto ya está compitiendo en la carrera seleccionada. Por favor, elige una carrera diferente si quieres moverlo.");
      else Alert.alert("ℹ️ YA ESTÁ ASIGNADO", "Este piloto ya está compitiendo en la carrera seleccionada.");
      return;
    }

    if (carreraDestino.participantes?.length >= 8) {
      const msj = "⚠️ CARRERA COMPLETA\n\nEsta carrera ya tiene 8/8 pilotos (capacidad máxima).\n\n¿Estás seguro de que quieres forzar y añadir un 9º piloto?\n\n⚠️ Esto puede causar problemas en la clasificación";
      if (Platform.OS === "web") {
        if (!window.confirm(msj)) return;
      } else {
         // En app móvil forzamos a que solo siga si es estricto, o permitimos con un Alert avanzado.
      }
    }

    setCargando(true);
    try {
      const batch = writeBatch(db);

      // 1. Si el piloto YA TENÍA coche, lo sacamos de su carrera actual
      if (pilotoSeleccionado.carreraId) {
        const carreraOrigen = carreras.find(c => c.id === pilotoSeleccionado.carreraId);
        if (carreraOrigen) {
          const participantesOrigen = carreraOrigen.participantes.filter(
            (p: any) => p.jugador_id !== pilotoSeleccionado.jugador_id
          );
          batch.update(doc(db, "carreras", carreraOrigen.id), { participantes: participantesOrigen });
        }
      }

      // 2. Meterlo en la carrera de destino (Nuevo Coche)
      const participantesDestino = [...(carreraDestino.participantes || [])];
      participantesDestino.push({
        jugador_id: pilotoSeleccionado.jugador_id,
        nombre: pilotoSeleccionado.nombre,
        posicion: 0
      });
      batch.update(doc(db, "carreras", carreraDestino.id), { participantes: participantesDestino });

      // 3. Ejecutar el cambio
      await batch.commit();

      // 📝 REGISTRAR LOG DE AUDITORÍA
      const carreraOrigenNombre = pilotoSeleccionado.carreraId ? carreras.find(c => c.id === pilotoSeleccionado.carreraId)?.nombre_carrera : "Sin carrera";
      await registrarLog(
        "admin@torneo.com",
        "MOVER_PILOTO",
        `${pilotoSeleccionado.nombre} movido de '${carreraOrigenNombre}' a '${carreraDestino.nombre_carrera}'`
      );

      if (Platform.OS === "web") window.alert(`✅ ASIGNACIÓN COMPLETADA\n\n${pilotoSeleccionado.nombre} ha sido movido correctamente.\n\nLa parrilla se ha actualizado automáticamente.`);
      else Alert.alert("✅ ASIGNACIÓN COMPLETADA", `${pilotoSeleccionado.nombre} ha sido movido correctamente.`);

      // Resetear e ir al paso 1
      setPilotoSeleccionado(null);
      setPaso(1);
      await cargarDatos();

    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") window.alert("❌ ERROR EN ASIGNACIÓN\n\nNo se pudo completar el movimiento del piloto. Por favor, verifica tu conexión e inténtalo de nuevo.");
      else Alert.alert("❌ ERROR EN ASIGNACIÓN", "No se pudo completar el movimiento. Verifica tu conexión e inténtalo de nuevo.");
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

      <Text style={styles.titulo}>🔄 Fichajes y Reservas</Text>
      
      {paso === 1 && (
        <>
          <Text style={styles.subtitulo}>PASO 1: Selecciona el piloto que quieres mover o rescatar de la reserva.</Text>
          
          {/* 🚨 ALERTA DE PILOTOS SIN CARRERA */}
          {pilotos.filter(p => !p.carreraId).length > 0 && (
            <View style={styles.alertaReservas}>
              <Text style={styles.textoAlerta}>⚠️ HAY {pilotos.filter(p => !p.carreraId).length} PILOTO(S) SIN CARRERA ASIGNADA</Text>
              <Text style={styles.textoAlertaDetalle}>Aparecen destacados en rojo. Asígnalos a una carrera para que puedan competir.</Text>
            </View>
          )}
          
          {pilotos.length === 0 ? (
            <Text style={styles.textoVacio}>No hay pilotos registrados.</Text>
          ) : (
            pilotos.map(p => (
              <TouchableOpacity 
                key={p.jugador_id} 
                style={[
                  styles.tarjetaPiloto, 
                  // 🚨 Si no tiene carrera, lo pintamos de rojo para que destaque
                  !p.carreraId && { borderLeftColor: '#e63946', backgroundColor: '#fff0f0' }
                ]} 
                onPress={() => seleccionarPiloto(p)}
              >
                <Text style={styles.nombrePiloto}>{p.nombre}</Text>
                <Text style={[styles.carreraActual, !p.carreraId && { color: '#e63946', fontWeight: 'bold' }]}>
                  {p.nombreCarrera}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {paso === 2 && pilotoSeleccionado && (
        <>
          <Text style={styles.subtitulo}>PASO 2: ¿A qué carrera metemos a <Text style={{color: '#e63946'}}>{pilotoSeleccionado.nombre}</Text>?</Text>
          <Text style={styles.infoDestino}>Estado actual: {pilotoSeleccionado.nombreCarrera}</Text>

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
  
  // 🚨 Alerta de pilotos sin carrera
  alertaReservas: { backgroundColor: "#fff3cd", borderWidth: 2, borderColor: "#ffc107", borderRadius: 8, padding: 15, marginBottom: 15 },
  textoAlerta: { fontSize: 14, fontWeight: "bold", color: "#856404", marginBottom: 5 },
  textoAlertaDetalle: { fontSize: 12, color: "#856404" },
  
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