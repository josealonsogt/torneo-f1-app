import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../services/firebaseConfig";
import { registrarLog } from "../../services/logService";
import { Jugador } from "../../types/entities";

export default function GestionPilotosScreen({ navigation }: any) {
  const [pilotos, setPilotos] = useState<(Jugador & { id: string })[]>([]);
  const [carrerasMap, setCarrerasMap] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  
  // 🔍 NUEVOS ESTADOS PARA FILTROS Y BÚSQUEDA
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [ordenamiento, setOrdenamiento] = useState<"nombre" | "fecha">("nombre");

  // Escuchar a los pilotos y a las carreras en tiempo real
  useEffect(() => {
    // 1. Escuchar Jugadores (sin ordenar aquí, lo haremos después con filtros)
    const jugadoresRef = collection(db, "jugadores");
    const unsubscribeJugadores = onSnapshot(jugadoresRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Jugador & { id: string })[];
      setPilotos(lista);
      setCargando(false);
    });

    // 2. Escuchar Carreras (EL RADAR)
    const carrerasRef = collection(db, "carreras");
    const unsubscribeCarreras = onSnapshot(carrerasRef, (snapshot) => {
      const nuevoMapa: Record<string, string> = {};
      
      snapshot.forEach((carreraDoc) => {
        const carreraData = carreraDoc.data();
        if (carreraData.participantes) {
          carreraData.participantes.forEach((p: any) => {
            nuevoMapa[p.jugador_id] = carreraData.nombre_carrera;
          });
        }
      });
      
      setCarrerasMap(nuevoMapa);
    });

    return () => {
      unsubscribeJugadores();
      unsubscribeCarreras();
    };
  }, []);

  // 🎯 FILTRADO Y ORDENAMIENTO INTELIGENTE (useMemo para optimizar)
  const pilotosFiltrados = useMemo(() => {
    let resultado = [...pilotos];

    // 1. FILTRO POR BÚSQUEDA (nombre o DNI)
    if (textoBusqueda.trim()) {
      const busqueda = textoBusqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(busqueda) || 
        p.dni.toLowerCase().includes(busqueda)
      );
    }

    // 2. FILTRO POR ESTADO
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(p => p.estado_torneo === filtroEstado);
    }

    // 3. ORDENAMIENTO
    if (ordenamiento === "nombre") {
      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (ordenamiento === "fecha") {
      resultado.sort((a, b) => {
        const fechaA = a.fecha_registro instanceof Date 
          ? a.fecha_registro.getTime() 
          : (a.fecha_registro?.toMillis?.() || 0);
        const fechaB = b.fecha_registro instanceof Date 
          ? b.fecha_registro.getTime() 
          : (b.fecha_registro?.toMillis?.() || 0);
        return fechaB - fechaA; // Más reciente primero
      });
    }

    return resultado;
  }, [pilotos, textoBusqueda, filtroEstado, ordenamiento]);

  // Lógica de borrado con LOG DE AUDITORÍA
  const ejecutarExpulsion = async (idPiloto: string, nombrePiloto: string, dniPiloto: string) => {
    try {
      const carreraAsignada = carrerasMap[idPiloto] || "Sin carrera";
      
      await deleteDoc(doc(db, "jugadores", idPiloto));

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

      // 📝 REGISTRAR LOG DE AUDITORÍA
      await registrarLog(
        "admin@torneo.com", // TODO: Obtener del contexto de autenticación
        "ELIMINAR_PILOTO",
        `Piloto eliminado: ${nombrePiloto} (DNI: ${dniPiloto}) de ${carreraAsignada}`
      );

      if (Platform.OS === "web") window.alert(`✅ PILOTO ELIMINADO\n\n${nombrePiloto} ha sido expulsado del torneo correctamente.\n\nSe ha liberado 1 plaza.`);
      else Alert.alert("✅ PILOTO ELIMINADO", `${nombrePiloto} ha sido expulsado del torneo correctamente.`);
      
    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") window.alert("❌ ERROR AL ELIMINAR\n\nNo se pudo completar la operación. Por favor, verifica tu conexión e inténtalo de nuevo.");
      else Alert.alert("❌ ERROR AL ELIMINAR", "No se pudo completar la operación. Verifica tu conexión e inténtalo de nuevo.");
    }
  };

  const eliminarPiloto = (idPiloto: string, nombrePiloto: string, dniPiloto: string) => {
    const mensaje = `¿Estás seguro de que quieres eliminar a ${nombrePiloto}?\n\nEsta acción:\n✓ Borrará al piloto de la base de datos\n✓ Lo sacará de su carrera asignada\n✓ Liberará 1 plaza en el torneo\n\n⚠️ Esta acción no se puede deshacer`;

    if (Platform.OS === "web") {
      const seguro = window.confirm("⚠️ Expulsar Piloto\n" + mensaje);
      if (seguro) ejecutarExpulsion(idPiloto, nombrePiloto, dniPiloto);
    } else {
      Alert.alert(
        "⚠️ Expulsar Piloto",
        mensaje,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sí, Expulsar", style: "destructive", onPress: () => ejecutarExpulsion(idPiloto, nombrePiloto, dniPiloto) }
        ]
      );
    }
  };

  // 📊 EXPORTAR A CSV
  const exportarACSV = async () => {
    const headers = "Nombre,DNI,Correo,Estado,Carrera Asignada,Fecha Registro\n";
    const filas = pilotosFiltrados.map(p => {
      const fechaRegistro = p.fecha_registro instanceof Date 
        ? p.fecha_registro.toLocaleDateString() 
        : (p.fecha_registro?.toDate?.()?.toLocaleDateString() || "Sin fecha");
      
      return `"${p.nombre}","${p.dni}","${p.correo}","${p.estado_torneo}","${carrerasMap[p.id] || 'Sin carrera'}","${fechaRegistro}"`;
    }).join("\n");

    const csv = headers + filas;
    
    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pilotos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      // 📝 REGISTRAR LOG DE AUDITORÍA
      await registrarLog(
        "admin@torneo.com",
        "EXPORTAR_CSV",
        `Exportados ${pilotosFiltrados.length} pilotos a CSV`
      );
    } else {
      Alert.alert("ℹ️ FUNCIONALIDAD", "Exportar CSV solo disponible en web por ahora.");
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
      <Text style={styles.titulo}>👥 Control de Pilotos</Text>
      <Text style={styles.subtitulo}>Total inscritos: {pilotos.length} | Mostrando: {pilotosFiltrados.length}</Text>

      {/* 📊 BOTÓN EXPORTAR CSV */}
      <TouchableOpacity style={styles.botonExportar} onPress={exportarACSV}>
        <MaterialCommunityIcons name="file-export" size={20} color="#fff" />
        <Text style={styles.textoBotonExportar}>Exportar a CSV</Text>
      </TouchableOpacity>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <View style={styles.barraBusqueda}>
        <TextInput
          style={styles.inputBusqueda}
          placeholder="🔍 Buscar por nombre o DNI..."
          placeholderTextColor="#999"
          value={textoBusqueda}
          onChangeText={setTextoBusqueda}
        />
        {textoBusqueda.length > 0 && (
          <TouchableOpacity onPress={() => setTextoBusqueda("")} style={styles.botonLimpiar}>
            <Text style={styles.textoLimpiar}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🎛️ FILTROS Y ORDENAMIENTO */}
      <View style={styles.seccionFiltros}>
        <Text style={styles.labelFiltro}>Filtrar por estado:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaBotonesFiltro}>
          {["todos", "inscrito", "clasificado_semi_a", "clasificado_semi_b", "eliminado"].map(estado => (
            <TouchableOpacity
              key={estado}
              style={[styles.botonFiltro, filtroEstado === estado && styles.botonFiltroActivo]}
              onPress={() => setFiltroEstado(estado)}
            >
              <Text style={[styles.textoFiltro, filtroEstado === estado && styles.textoFiltroActivo]}>
                {estado === "todos" ? "Todos" : estado.replace(/_/g, " ").toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.labelFiltro, { marginTop: 10 }]}>Ordenar por:</Text>
        <View style={styles.filaBotonesOrden}>
          <TouchableOpacity
            style={[styles.botonOrden, ordenamiento === "nombre" && styles.botonOrdenActivo]}
            onPress={() => setOrdenamiento("nombre")}
          >
            <Text style={[styles.textoOrden, ordenamiento === "nombre" && styles.textoOrdenActivo]}>Nombre A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonOrden, ordenamiento === "fecha" && styles.botonOrdenActivo]}
            onPress={() => setOrdenamiento("fecha")}
          >
            <Text style={[styles.textoOrden, ordenamiento === "fecha" && styles.textoOrdenActivo]}>Más Recientes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📋 LISTA DE PILOTOS */}
      {pilotosFiltrados.length === 0 ? (
        <Text style={styles.textoVacio}>
          {textoBusqueda || filtroEstado !== "todos" 
            ? "No se encontraron pilotos con esos filtros." 
            : "No hay ningún piloto registrado todavía."}
        </Text>
      ) : (
        pilotosFiltrados.map((piloto) => {
          const fechaRegistro = piloto.fecha_registro instanceof Date 
            ? piloto.fecha_registro 
            : piloto.fecha_registro?.toDate?.();
          const fechaTexto = fechaRegistro 
            ? `${fechaRegistro.getDate()}/${fechaRegistro.getMonth() + 1}/${fechaRegistro.getFullYear()} ${fechaRegistro.getHours()}:${String(fechaRegistro.getMinutes()).padStart(2, '0')}`
            : "Sin fecha";

          return (
            <View key={piloto.id} style={styles.tarjeta}>
              <View style={styles.info}>
                <Text style={styles.nombre}>{piloto.nombre}</Text>
                <Text style={styles.dni}>DNI: {piloto.dni}</Text>
                <Text style={styles.fecha}>📅 {fechaTexto}</Text>
                <Text style={styles.estado}>Estado: {piloto.estado_torneo.toUpperCase()}</Text>
                
                {/* 📍 RADAR DE CARRERA */}
                <View style={styles.badgeCarrera}>
                  <Text style={styles.textoBadgeCarrera}>
                    {carrerasMap[piloto.id] 
                      ? `📍 ${carrerasMap[piloto.id]}` 
                      : "❌ Sin carrera asignada"}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.botonBorrar} 
                onPress={() => eliminarPiloto(piloto.id, piloto.nombre, piloto.dni)}
              >
                <Text style={styles.textoBotonBorrar}>🗑️ Echar</Text>
              </TouchableOpacity>
            </View>
          );
        })
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
  
  // 📊 Botón exportar CSV
  botonExportar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#2a9d8f', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    marginBottom: 15,
    justifyContent: 'center'
  },
  textoBotonExportar: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  
  // 🔍 Estilos de barra de búsqueda
  barraBusqueda: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 8, paddingHorizontal: 12, marginBottom: 15, borderWidth: 1, borderColor: "#ddd" },
  inputBusqueda: { flex: 1, paddingVertical: 12, fontSize: 16, color: "#000" },
  botonLimpiar: { padding: 5 },
  textoLimpiar: { fontSize: 18, color: "#999", fontWeight: "bold" },
  
  // 🎛️ Estilos de filtros
  seccionFiltros: { marginBottom: 20, padding: 15, backgroundColor: "#f9f9f9", borderRadius: 8, borderWidth: 1, borderColor: "#eee" },
  labelFiltro: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 8 },
  filaBotonesFiltro: { flexDirection: "row", marginBottom: 5 },
  botonFiltro: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#ddd" },
  botonFiltroActivo: { backgroundColor: "#0077b6", borderColor: "#0077b6" },
  textoFiltro: { fontSize: 13, color: "#666", fontWeight: "600" },
  textoFiltroActivo: { color: "#fff" },
  
  filaBotonesOrden: { flexDirection: "row", gap: 10 },
  botonOrden: { flex: 1, backgroundColor: "#fff", paddingVertical: 10, borderRadius: 6, alignItems: "center", borderWidth: 1, borderColor: "#ddd" },
  botonOrdenActivo: { backgroundColor: "#2a9d8f", borderColor: "#2a9d8f" },
  textoOrden: { fontSize: 14, color: "#666", fontWeight: "600" },
  textoOrdenActivo: { color: "#fff" },
  
  // 📋 Estilos de tarjetas de pilotos
  tarjeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9f9f9", padding: 15, borderWidth: 1, borderColor: "#ddd", marginBottom: 10, borderRadius: 8 },
  info: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 3 },
  dni: { fontSize: 14, color: "#666" },
  fecha: { fontSize: 12, color: "#888", marginTop: 2 },
  estado: { fontSize: 12, color: "#2a9d8f", fontWeight: "bold", marginTop: 3 },
  
  badgeCarrera: { marginTop: 8, backgroundColor: "#e0fbfc", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  textoBadgeCarrera: { fontSize: 12, color: "#0077b6", fontWeight: "bold" },

  botonBorrar: { backgroundColor: "#ffe5e5", paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: "#e63946", borderRadius: 6 },
  textoBotonBorrar: { color: "#e63946", fontWeight: "bold" }
});
