import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../services/firebaseConfig";
import { Carrera } from "../types/entities";

export default function GestionCarrerasScreen() {
  const navigation = useNavigation();
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<(Carrera & { id: string }) | null>(null);
  const [posiciones, setPosiciones] = useState<{ [key: string]: string }>({});
  const [horaCarrera, setHoraCarrera] = useState("");

  useEffect(() => {
    cargarCarreras();
  }, []);

  const cargarCarreras = async () => {
    try {
      const carrerasRef = collection(db, "carreras");
      const snapshot = await getDocs(carrerasRef);
      const listaCarreras = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Carrera & { id: string })[];

      // Ordenar por fase y número
      listaCarreras.sort((a, b) => a.numero - b.numero);
      setCarreras(listaCarreras);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarCarrera = (carrera: Carrera & { id: string }) => {
    setCarreraSeleccionada(carrera);
    // Inicializar posiciones con los valores actuales
    setHoraCarrera(carrera.hora || ""); // <--- NUEVO
    const posInicial: { [key: string]: string } = {};
    carrera.participantes.forEach((p) => {
      posInicial[p.jugador_id] = p.posicion > 0 ? p.posicion.toString() : "";
    });
    setPosiciones(posInicial);
  };

  const guardarHora = async () => {
    if (!carreraSeleccionada) return;
    try {
      const carreraRef = doc(db, "carreras", carreraSeleccionada.id);
      await updateDoc(carreraRef, { hora: horaCarrera });
      Alert.alert("¡Hora guardada! 🕒", `La carrera ahora está programada a las ${horaCarrera}`);
      cargarCarreras();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la hora.");
    }
  };

  const guardarResultados = async () => {
    if (!carreraSeleccionada) return;

    // Validar que todas las posiciones estén entre 1 y 8
    const posicionesArray = Object.values(posiciones).map((v) => parseInt(v));
    const hayVacias = posicionesArray.some((p) => isNaN(p) || p < 1 || p > 8);

    if (hayVacias) {
      Alert.alert("Error", "Todas las posiciones deben estar entre 1 y 8");
      return;
    }

    // Validar que no haya posiciones repetidas
    const posicionesUnicas = new Set(posicionesArray);
    if (posicionesUnicas.size !== posicionesArray.length) {
      Alert.alert("Error", "No puede haber posiciones repetidas");
      return;
    }

    try {
      const batch = writeBatch(db); 

      // 1. Actualizamos la carrera
      const participantesActualizados = carreraSeleccionada.participantes.map((p) => ({
        ...p,
        posicion: parseInt(posiciones[p.jugador_id]),
      }));
      
      const carreraRef = doc(db, "carreras", carreraSeleccionada.id);
      batch.update(carreraRef, {
        participantes: participantesActualizados,
        estado: "finalizada",
      });

      // 2. MAGIA: Actualizamos el estado de cada piloto en Firebase
      participantesActualizados.forEach((p) => {
        let nuevoEstado = "eliminado"; // Por defecto, estás fuera
        const pos = p.posicion;
        const fase = carreraSeleccionada.fase;

        // Reglas de clasificación según la fase de la carrera
        if (fase === "clasificatoria") {
          if (pos === 1) nuevoEstado = "clasificado_semi_a";
          else if (pos === 2) nuevoEstado = "clasificado_semi_b";
        } else if (fase === "semifinal_a") {
          if (pos >= 1 && pos <= 3) nuevoEstado = "finalista";
        } else if (fase === "semifinal_b") {
          if (pos >= 1 && pos <= 4) nuevoEstado = "clasificado_final_b";
        } else if (fase === "final_b") {
          if (pos >= 1 && pos <= 2) nuevoEstado = "finalista";
        } else if (fase === "final") {
          if (pos === 1) nuevoEstado = "ganador";
        }

        const jugadorRef = doc(db, "jugadores", p.jugador_id);
        batch.update(jugadorRef, { estado_torneo: nuevoEstado });
      });

      // Enviamos todo a Firebase de golpe
      await batch.commit();

      Alert.alert("¡Listo! 🏁", "Resultados guardados y pilotos actualizados.");
      setCarreraSeleccionada(null);
      cargarCarreras();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron guardar los resultados");
    }
  };

  if (cargando) {
    return (
      <View style={styles.containerCargando}>
        <ActivityIndicator size="large" color="#003049" />
      </View>
    );
  }

  if (carreraSeleccionada) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>{carreraSeleccionada.nombre_carrera}</Text>
        <Text style={styles.subtitulo}>Asignar posiciones (1-8)</Text>

        {/* --- NUEVA ZONA PARA LA HORA --- */}
        <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#ccc' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>🕒 Fijar Horario:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, marginRight: 10, borderRadius: 5, fontSize: 16 }}
              placeholder="Ej: 11:30"
              value={horaCarrera}
              onChangeText={setHoraCarrera}
            />
            <Button title="Actualizar Hora" onPress={guardarHora} color="#2a9d8f" />
          </View>
        </View>
        {/* ------------------------------- */}

        {carreraSeleccionada.participantes.map((participante, index) => (
          <View key={participante.jugador_id} style={styles.filaPiloto}>
            <Text style={styles.nombrePiloto}>{participante.nombre}</Text>
            <TextInput
              style={styles.inputPosicion}
              keyboardType="number-pad"
              maxLength={1}
              value={posiciones[participante.jugador_id] || ""}
              onChangeText={(text) =>
                setPosiciones({ ...posiciones, [participante.jugador_id]: text })
              }
              placeholder="Pos"
            />
          </View>
        ))}

        <View style={{ marginTop: 20 }}>
          <Button title="Guardar Resultados" onPress={guardarResultados} color="#e63946" />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button
            title="Cancelar"
            onPress={() => setCarreraSeleccionada(null)}
            color="#666"
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Gestión de Carreras</Text>
      <Text style={styles.subtitulo}>Selecciona una carrera para asignar posiciones</Text>

      {carreras.length === 0 ? (
        <Text style={styles.textoVacio}>
          No hay carreras generadas. Ve al panel admin y genera las clasificatorias.
        </Text>
      ) : (
        carreras.map((carrera) => (
          <TouchableOpacity
            key={carrera.id}
            style={[
              styles.tarjetaCarrera,
              carrera.estado === "finalizada" && styles.tarjetaFinalizada,
            ]}
            onPress={() => seleccionarCarrera(carrera)}
          >
            <Text style={styles.nombreCarrera}>{carrera.nombre_carrera}</Text>
            <Text style={styles.textoEstado}>
              Estado: {carrera.estado.toUpperCase()}
            </Text>
            <Text style={styles.textoFase}>Fase: {carrera.fase}</Text>
          </TouchableOpacity>
        ))
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Volver" onPress={() => navigation.goBack()} color="#666" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fdf0d5" },
  containerCargando: { flex: 1, justifyContent: "center", alignItems: "center" },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#003049",
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  textoVacio: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginTop: 40,
  },
  tarjetaCarrera: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tarjetaFinalizada: {
    backgroundColor: "#e8f5e9",
  },
  nombreCarrera: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003049",
    marginBottom: 5,
  },
  textoEstado: {
    fontSize: 14,
    color: "#666",
  },
  textoFase: {
    fontSize: 12,
    color: "#999",
  },
  filaPiloto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  nombrePiloto: {
    fontSize: 16,
    flex: 1,
    color: "#003049",
  },
  inputPosicion: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: "#003049",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "white",
  },
});
