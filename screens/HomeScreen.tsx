import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { EstadoJugador } from "../types/entities";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const jugadorId = route.params?.jugadorId;

  const [faseActual, setFaseActual] = useState("Cargando...");
  const [estadoJugador, setEstadoJugador] = useState<EstadoJugador>("inscrito");
  const [miCarrera, setMiCarrera] = useState<any>(null);
  const [nombreJugador, setNombreJugador] = useState("");

  // 🎯 PASO 1: Escuchar el estado del jugador en tiempo real
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

  // 🎯 PASO 2: Escuchar la fase actual del torneo
  useEffect(() => {
    const docRef = doc(db, "configuracion", "torneo");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFaseActual(docSnap.data().fase_actual);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🎯 PASO 3: Buscar MI carrera según mi estado
  useEffect(() => {
    if (!jugadorId || !estadoJugador) return;

    const mapeoEstadoAFase: Record<EstadoJugador, string | null> = {
      inscrito: "clasificatoria",
      clasificado_semi_a: "semifinal_a",
      clasificado_semi_b: "semifinal_b",
      clasificado_final_b: "final_b",
      finalista: "final",
      eliminado: null,
      ganador: null,
    };

    const faseBuscada = mapeoEstadoAFase[estadoJugador];

    if (!faseBuscada) {
      setMiCarrera(null);
      return;
    }

    const carrerasRef = collection(db, "carreras");
    const q = query(carrerasRef, where("fase", "==", faseBuscada));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let carreraEncontrada = null;

      snapshot.forEach((docSnap) => {
        const datos = docSnap.data();
        const carrera = { 
          id: docSnap.id, 
          ...datos 
        } as any; 
        
        if (!carrera.participantes || !Array.isArray(carrera.participantes)) {
          return;
        }
        
        const estaEnCarrera = carrera.participantes.some(
          (p: any) => p && p.jugador_id === jugadorId
        );
        
        if (estaEnCarrera) {
          carreraEncontrada = carrera;
        }
      });

      setMiCarrera(carreraEncontrada);
    });

    return () => unsubscribe();
  }, [jugadorId, estadoJugador]);


  // 🎨 PASO 4: Función para obtener el emoji y mensaje según el estado
  const obtenerMensajeEstado = () => {
    switch (estadoJugador) {
      case "inscrito":
        return { emoji: "🏁", texto: "Preparado para clasificatorias", color: "#003049" };
      case "clasificado_semi_a":
        return { emoji: "🔥", texto: "¡Clasificado a SEMIFINAL A!", color: "#e63946" };
      case "clasificado_semi_b":
        return { emoji: "⚡", texto: "¡Clasificado a SEMIFINAL B!", color: "#f77f00" };
      case "clasificado_final_b":
        return { emoji: "🎯", texto: "¡En la FINAL B!", color: "#06ffa5" };
      case "finalista":
        return { emoji: "🏆", texto: "¡ESTÁS EN LA GRAN FINAL!", color: "#ffd700" };
      case "eliminado":
        return { emoji: "😢", texto: "Eliminado del torneo", color: "#666" };
      case "ganador":
        return { emoji: "👑", texto: "¡CAMPEÓN DEL TORNEO!", color: "#ffd700" };
      default:
        return { emoji: "❓", texto: "Estado desconocido", color: "#000" };
    }
  };

  const mensaje = obtenerMensajeEstado();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Panel del Piloto 🏁</Text>
      <Text style={styles.nombre}>{nombreJugador}</Text>

      {/* 📊 Estado del Torneo */}
      <View style={styles.tarjeta}>
        <Text style={styles.textoGris}>Estado del torneo:</Text>
        <Text style={styles.fase}>{faseActual.toUpperCase()}</Text>
      </View>

      {/* 🎯 Estado del Jugador */}
      <View style={[styles.tarjeta, { borderColor: mensaje.color, borderWidth: 2 }]}>
        <Text style={styles.emoji}>{mensaje.emoji}</Text>
        <Text style={[styles.estadoTexto, { color: mensaje.color }]}>
          {mensaje.texto}
        </Text>
      </View>

      {/* 🏎️ Mi Próxima Carrera */}
      {estadoJugador === "eliminado" && (
        <View style={styles.tarjetaEliminado}>
          <Text style={styles.textoEliminado}>
            Gracias por participar en el torneo.{"\n"}
            ¡Nos vemos en la próxima edición! 🏁
          </Text>
        </View>
      )}

      {estadoJugador === "ganador" && (
        <View style={styles.tarjetaGanador}>
          <Text style={styles.textoGanador}>
            🏆 ¡FELICIDADES! 🏆{"\n"}
            Eres el campeón absoluto del torneo
          </Text>
        </View>
      )}

      {miCarrera && estadoJugador !== "eliminado" && estadoJugador !== "ganador" && (
        <View style={styles.tarjetaCarrera}>
          <Text style={styles.tituloCarrera}>📍 {miCarrera.nombre_carrera}</Text>
          
          {/* ✨ MAGIA AQUÍ: Cartel rojo si está en curso */}
          {miCarrera.estado === "en_curso" ? (
            <View style={styles.enCursoContainer}>
              <Text style={styles.textoEnCurso}>🔴 CORRIENDO AHORA</Text>
            </View>
          ) : (
            <Text style={styles.subtituloCarrera}>Estado: {miCarrera.estado.toUpperCase()}</Text>
          )}

          {miCarrera.hora ? (
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#c1121f', marginBottom: 5}}>
              🕒 Hora de inicio: {miCarrera.hora}
            </Text>
          ) : (
            <Text style={{fontSize: 16, fontStyle: 'italic', color: '#666', marginBottom: 5}}>
              🕒 Hora: Por definir
            </Text>
          )}

          <View style={styles.participantesContainer}>
            <Text style={styles.participantesTitulo}>Parrilla de Salida:</Text>
            {miCarrera.participantes?.map((participante: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.participanteItem,
                  participante.jugador_id === jugadorId && styles.participanteYo,
                ]}
              >
                <Text style={styles.participanteNumero}>P{index + 1}</Text>
                <Text
                  style={[
                    styles.participanteNombre,
                    participante.jugador_id === jugadorId && styles.participanteYoTexto,
                  ]}
                >
                  {participante.nombre}
                  {participante.jugador_id === jugadorId && " (TÚ)"}
                </Text>
                {participante.posicion > 0 && (
                  <Text style={styles.posicionFinal}>
                    → Posición: {participante.posicion}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {!miCarrera && estadoJugador !== "eliminado" && estadoJugador !== "ganador" && (
        <View style={styles.tarjetaSinCarrera}>
          <Text style={styles.textoSinCarrera}>
            Esperando que se genere la siguiente fase...
          </Text>
        </View>
      )}

      {/* BOTONES FINALES */}
      <View style={{ marginTop: 20, width: "100%", marginBottom: 40 }}>
        <View style={{ marginBottom: 15 }}>
          <Button
            title="Ver Cuadrante del Torneo 🏆"
            onPress={() => navigation.navigate("TorneoPublicoScreen")}
            color="#2a9d8f"
          />
        </View>
        <Button
          title="Cerrar Sesión"
          onPress={() => navigation.replace("Login")}
          color="#000"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
  nombre: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  tarjeta: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    marginBottom: 15,
  },
  textoGris: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  fase: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  estadoTexto: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  tarjetaCarrera: {
    width: "100%",
    padding: 20,
    borderWidth: 2,
    borderColor: "#003049",
    backgroundColor: "#f0f0f0",
    marginBottom: 15,
  },
  tituloCarrera: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#003049",
    marginBottom: 10,
  },
  subtituloCarrera: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    fontWeight: "bold",
  },
  // ✨ NUEVOS ESTILOS PARA "EN CURSO" ✨
  enCursoContainer: {
    backgroundColor: '#ffe5e5',
    borderColor: '#e63946',
    borderWidth: 2,
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  textoEnCurso: {
    color: '#e63946',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  // ------------------------------------
  participantesContainer: {
    marginTop: 10,
  },
  participantesTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  participanteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  participanteYo: {
    backgroundColor: "#ffd700",
    borderColor: "#e63946",
    borderWidth: 2,
  },
  participanteNumero: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 10,
    color: "#666",
  },
  participanteNombre: {
    fontSize: 16,
    flex: 1,
    color: "#000",
  },
  participanteYoTexto: {
    fontWeight: "bold",
    color: "#c1121f",
  },
  posicionFinal: {
    fontSize: 14,
    color: "#e63946",
    fontWeight: "bold",
  },
  tarjetaSinCarrera: {
    width: "100%",
    padding: 30,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  textoSinCarrera: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  tarjetaEliminado: {
    width: "100%",
    padding: 30,
    borderWidth: 2,
    borderColor: "#666",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    marginBottom: 15,
  },
  textoEliminado: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  tarjetaGanador: {
    width: "100%",
    padding: 30,
    borderWidth: 3,
    borderColor: "#ffd700",
    backgroundColor: "#fffbea",
    alignItems: "center",
    marginBottom: 15,
  },
  textoGanador: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
    lineHeight: 28,
  },
});