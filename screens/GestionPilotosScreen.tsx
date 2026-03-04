import { collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { Jugador } from "../types/entities";

export default function GestionPilotosScreen({ navigation }: any) {
  const [pilotos, setPilotos] = useState<(Jugador & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);

  // Escuchar a todos los pilotos en tiempo real
  useEffect(() => {
    const jugadoresRef = collection(db, "jugadores");
    const unsubscribe = onSnapshot(jugadoresRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Jugador & { id: string })[];
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setPilotos(lista);
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Lógica real de borrado aislada para poder llamarla desde Web o Móvil
  const ejecutarExpulsion = async (idPiloto: string, nombrePiloto: string) => {
    try {
      // Borrar de jugadores
      await deleteDoc(doc(db, "jugadores", idPiloto));

      // Sacarlo de su carrera
      const carrerasRef = collection(db, "carreras");
      const snapshot = await getDocs(carrerasRef);
      
      snapshot.forEach(async (carreraDoc) => {
        const carreraData = carreraDoc.data();
        if (carreraData.participantes) {
          const participantesLimpios = carreraData.participantes.filter(
            (p: any) => p.jugador_id !== idPiloto
          );
          
          if (participantesLimpios.length !== carreraData.participantes.length) {
            await updateDoc(doc(db, "carreras", carreraDoc.id), {
              participantes: participantesLimpios
            });
          }
        }
      });

      if (Platform.OS === "web") window.alert(`${nombrePiloto} ha sido expulsado del torneo.`);
      else Alert.alert("Eliminado", `${nombrePiloto} ha sido expulsado del torneo.`);
      
    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") window.alert("No se pudo eliminar al piloto.");
      else Alert.alert("Error", "No se pudo eliminar al piloto.");
    }
  };

  // 2. Función del botón que lanza la alerta correcta según el dispositivo
  const eliminarPiloto = (idPiloto: string, nombrePiloto: string) => {
    const mensaje = `¿Estás seguro de que quieres eliminar a ${nombrePiloto} del torneo?\n\nEsto lo borrará de la base de datos y lo sacará de la carrera en la que esté apuntado.`;

    if (Platform.OS === "web") {
      const seguro = window.confirm("⚠️ Expulsar Piloto\n" + mensaje);
      if (seguro) ejecutarExpulsion(idPiloto, nombrePiloto);
    } else {
      Alert.alert(
        "⚠️ Expulsar Piloto",
        mensaje,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sí, Expulsar ", style: "destructive", onPress: () => ejecutarExpulsion(idPiloto, nombrePiloto) }
        ]
      );
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}> Control de Pilotos</Text>
      <Text style={styles.subtitulo}>Total inscritos: {pilotos.length}</Text>

      {pilotos.length === 0 ? (
        <Text style={styles.textoVacio}>No hay ningún piloto registrado todavía.</Text>
      ) : (
        pilotos.map((piloto) => (
          <View key={piloto.id} style={styles.tarjeta}>
            <View style={styles.info}>
              <Text style={styles.nombre}>{piloto.nombre}</Text>
              <Text style={styles.dni}>DNI: {piloto.dni}</Text>
              <Text style={styles.estado}>Estado: {piloto.estado_torneo.toUpperCase()}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.botonBorrar} 
              onPress={() => eliminarPiloto(piloto.id, piloto.nombre)}
            >
              <Text style={styles.textoBotonBorrar}>🗑️ Echar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={{ marginTop: 30, marginBottom: 40 }}>
        <Button title="Volver al Panel" onPress={() => navigation.goBack()} color="#000" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  titulo: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: "#000", marginBottom: 5 },
  subtitulo: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 20, fontWeight: "bold" },
  textoVacio: { fontSize: 16, textAlign: "center", color: "#666", marginTop: 40 },
  
  tarjeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9f9f9", padding: 15, borderWidth: 1, borderColor: "#ddd", marginBottom: 10 },
  info: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 3 },
  dni: { fontSize: 14, color: "#666" },
  estado: { fontSize: 12, color: "#2a9d8f", fontWeight: "bold", marginTop: 3 },
  
  botonBorrar: { backgroundColor: "#ffe5e5", paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: "#e63946" },
  textoBotonBorrar: { color: "#e63946", fontWeight: "bold" }
});