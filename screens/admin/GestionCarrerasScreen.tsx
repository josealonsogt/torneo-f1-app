import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { collection, doc, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Linking, // <-- IMPORTANTE: Añadido para abrir WhatsApp
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../services/firebaseConfig";
import { Carrera } from "../../types/entities";

export default function GestionCarrerasScreen() {
  const navigation = useNavigation();
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<(Carrera & { id: string }) | null>(null);
  const [posiciones, setPosiciones] = useState<{ [key: string]: string }>({});
  const [horaCarrera, setHoraCarrera] = useState("");
  const [filtroFase, setFiltroFase] = useState<string | null>(null);

  useEffect(() => {
    const carrerasRef = collection(db, "carreras");
    
    const unsubscribe = onSnapshot(carrerasRef, (snapshot) => {
      const listaCarreras = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Carrera & { id: string })[];

      listaCarreras.sort((a, b) => a.numero - b.numero);
      setCarreras(listaCarreras);
      setCargando(false);

      setCarreraSeleccionada((actual) => {
        if (!actual) return null;
        const actualizada = listaCarreras.find(c => c.id === actual.id);
        return actualizada || actual;
      });
    });

    return () => unsubscribe();
  }, []);

  const seleccionarCarrera = (carrera: Carrera & { id: string }) => {
    setCarreraSeleccionada(carrera);
    setHoraCarrera(carrera.hora || ""); 
    const posInicial: { [key: string]: string } = {};
    carrera.participantes.forEach((p) => {
      posInicial[p.jugador_id] = p.posicion === 99 ? "DNF" : (p.posicion > 0 ? p.posicion.toString() : "");
    });
    setPosiciones(posInicial);
  };

  const guardarHora = async () => {
    if (!carreraSeleccionada) return;
    try {
      const carreraRef = doc(db, "carreras", carreraSeleccionada.id);
      await updateDoc(carreraRef, { hora: horaCarrera });
      Alert.alert("✅ HORA PROGRAMADA", `La carrera se ha programado correctamente para las ${horaCarrera}.\n\nLos pilotos podrán verla en su perfil.`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la hora.");
    }
  };

  const darSalida = async () => {
    if (!carreraSeleccionada) return;
    try {
      const carreraRef = doc(db, "carreras", carreraSeleccionada.id);
      await updateDoc(carreraRef, { estado: "en_curso" });
      Alert.alert("🟢 CARRERA INICIADA", "El semáforo está en verde. La carrera está EN CURSO.\n\nLos pilotos verán el estado actualizado en tiempo real.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cambiar el estado.");
    }
  };

  // 📲 NUEVA FUNCIÓN: AVISAR POR WHATSAPP
  const avisarPorWhatsApp = () => {
    if (!carreraSeleccionada || !carreraSeleccionada.participantes || carreraSeleccionada.participantes.length === 0) {
      Alert.alert("ℹ️ CARRERA VACÍA", "No hay pilotos asignados a esta carrera todavía.\n\nAsigna pilotos desde 'Mover Pilotos' antes de intentar contactarlos.");
      return;
    }
    
    const nombres = carreraSeleccionada.participantes.map((p: any) => p.nombre).join(", ");
    const hora = horaCarrera ? ` a las ${horaCarrera}` : " en breve";
    const mensaje = `*¡ATENCIÓN PILOTOS!* \nLa *${carreraSeleccionada.nombre_carrera}* está a punto de comenzar${hora}.\n\nParticipantes: ${nombres}\n\n¡Acudid inmediatamente a la zona de pista! `;
    
const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url).catch(() => Alert.alert("❌ ERROR", "No se pudo abrir WhatsApp. Verifica que tienes la aplicación instalada."));
  };

  const guardarResultados = async () => {
    if (!carreraSeleccionada) return;

    const posicionesArray = Object.values(posiciones).map((v) => 
      v.trim().toUpperCase() === "DNF" ? 99 : parseInt(v)
    );
    
    const hayInvalidas = posicionesArray.some((p) => isNaN(p) || (p < 1 && p !== 99) || (p > 8 && p !== 99));

    if (hayInvalidas) {
      Alert.alert("Error", "Debes rellenar todas las posiciones (1-8) o marcar DNF");
      return;
    }

    const posicionesNormales = posicionesArray.filter(p => p !== 99);
    const posicionesUnicas = new Set(posicionesNormales);
    if (posicionesUnicas.size !== posicionesNormales.length) {
      Alert.alert("Error", "No puede haber posiciones repetidas (excepto múltiples DNF)");
      return;
    }

    try {
      const batch = writeBatch(db); 

      const participantesActualizados = carreraSeleccionada.participantes.map((p) => {
        const inputValor = posiciones[p.jugador_id]?.trim().toUpperCase();
        return {
          ...p,
          posicion: inputValor === "DNF" ? 99 : parseInt(inputValor),
        };
      });
      
      const carreraRef = doc(db, "carreras", carreraSeleccionada.id);
      batch.update(carreraRef, {
        participantes: participantesActualizados,
        estado: "finalizada",
      });

      participantesActualizados.forEach((p) => {
        let nuevoEstado = "eliminado"; 
        const pos = p.posicion;
        const fase = carreraSeleccionada.fase;

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

      await batch.commit();

      Alert.alert("¡Listo!", "Resultados guardados y pilotos actualizados.");
      setCarreraSeleccionada(null);
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
        <Text style={styles.subtitulo}>Asignar posiciones (1-8 o DNF)</Text>

        <View style={{ backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#ccc' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 5 }}>
            <Ionicons name="time-outline" size={18} color="#003049" />
            <Text style={{ fontWeight: 'bold' }}>Fijar Horario:</Text>
          </View>
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

        {/* 🟢 BOTÓN NUEVO DE WHATSAPP APLICADO AQUÍ */}
        <View style={{ marginBottom: 10 }}>
          <Button title="📲 AVISAR A PILOTOS POR WHATSAPP" onPress={avisarPorWhatsApp} color="#25D366" />
        </View>
        
        {carreraSeleccionada.estado === "pendiente" && (
          <View style={{ marginBottom: 20 }}>
            <Button title="🟢 DAR SALIDA A LA CARRERA" onPress={darSalida} color="#2a9d8f" />
          </View>
        )}

        {carreraSeleccionada.participantes.map((participante) => (
          <View key={participante.jugador_id} style={styles.filaPiloto}>
            <Text style={styles.nombrePiloto}>{participante.nombre}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={styles.botonDNF}
                onPress={() => setPosiciones({ ...posiciones, [participante.jugador_id]: "DNF" })}
              >
                <Text style={styles.textoDNF}>DNF</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.inputPosicion}
                keyboardType="default" 
                maxLength={3} 
                value={posiciones[participante.jugador_id] || ""}
                onChangeText={(text) =>
                  setPosiciones({ ...posiciones, [participante.jugador_id]: text })
                }
                placeholder="Pos"
              />
            </View>
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
          No hay carreras generadas. Ve al panel admin y abre inscripciones.
        </Text>
      ) : (
        <>
          <View style={styles.contenedorFiltros}>
            <Text style={styles.tituloFiltros}>Filtrar por fase:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll}>
              <TouchableOpacity 
                style={[styles.botonFiltro, filtroFase === null && styles.botonFiltroActivo]}
                onPress={() => setFiltroFase(null)}
              >
                <Text style={[styles.textoFiltro, filtroFase === null && styles.textoFiltroActivo]}>
                  Todas ({carreras.length})
                </Text>
              </TouchableOpacity>
              
              {Array.from(new Set(carreras.map(c => c.fase))).map(fase => {
                const cantidad = carreras.filter(c => c.fase === fase).length;
                const faseLabel = fase === "clasificatoria" ? "Clasificatorias" 
                  : fase === "semifinal_a" ? "Semi A"
                  : fase === "semifinal_b" ? "Semi B"
                  : fase === "final_b" ? "Final B"
                  : "Final";
                
                return (
                  <TouchableOpacity 
                    key={fase}
                    style={[styles.botonFiltro, filtroFase === fase && styles.botonFiltroActivo]}
                    onPress={() => setFiltroFase(fase)}
                  >
                    <Text style={[styles.textoFiltro, filtroFase === fase && styles.textoFiltroActivo]}>
                      {faseLabel} ({cantidad})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {carreras
            .filter(c => filtroFase === null || c.fase === filtroFase)
            .map((carrera) => (
              <TouchableOpacity
                key={carrera.id}
                style={[
                  styles.tarjetaCarrera,
                  carrera.estado === "finalizada" && styles.tarjetaFinalizada,
                  carrera.estado === "en_curso" && styles.tarjetaEnCurso,
                ]}
                onPress={() => seleccionarCarrera(carrera)}
              >
                <Text style={styles.nombreCarrera}>{carrera.nombre_carrera}</Text>
                <Text style={{ fontSize: 13, color: '#e63946', fontWeight: 'bold', marginBottom: 5 }}>
                  Participantes: {carrera.participantes ? carrera.participantes.length : 0}/8
                </Text>
                <Text style={styles.textoEstado}>
                  Estado: {carrera.estado.toUpperCase()}
                </Text>
                <Text style={styles.textoFase}>Fase: {carrera.fase}</Text>
              </TouchableOpacity>
            ))}
          
          {carreras.filter(c => filtroFase === null || c.fase === filtroFase).length === 0 && (
            <Text style={styles.textoVacio}>
              No hay carreras para esta fase
            </Text>
          )}
        </>
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
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "#003049", marginBottom: 5 },
  subtitulo: { fontSize: 14, textAlign: "center", color: "#666", marginBottom: 20 },
  textoVacio: { fontSize: 16, textAlign: "center", color: "#666", marginTop: 40 },
  tarjetaCarrera: { backgroundColor: "white", padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#ccc" },
  tarjetaFinalizada: { backgroundColor: "#e8f5e9", borderColor: "#4caf50" },
  tarjetaEnCurso: { backgroundColor: "#fff3e0", borderColor: "#ff9800" },
  nombreCarrera: { fontSize: 18, fontWeight: "bold", color: "#003049", marginBottom: 5 },
  textoEstado: { fontSize: 14, color: "#666" },
  textoFase: { fontSize: 12, color: "#999" },
  filaPiloto: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: 15, marginBottom: 10, borderRadius: 5, borderWidth: 1, borderColor: "#ddd" },
  nombrePiloto: { fontSize: 16, flex: 1, color: "#003049" },
  inputPosicion: { width: 50, height: 40, borderWidth: 1, borderColor: "#003049", textAlign: "center", fontSize: 16, fontWeight: "bold", backgroundColor: "white" },
  botonDNF: { backgroundColor: '#666', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, marginRight: 10 },
  textoDNF: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  contenedorFiltros: { marginBottom: 15 },
  tituloFiltros: { fontSize: 14, fontWeight: 'bold', color: '#003049', marginBottom: 8 },
  filtrosScroll: { flexDirection: 'row' },
  botonFiltro: { backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ccc' },
  botonFiltroActivo: { backgroundColor: '#003049', borderColor: '#003049' },
  textoFiltro: { fontSize: 13, color: '#666', fontWeight: '500' },
  textoFiltroActivo: { color: 'white', fontWeight: 'bold' }
});