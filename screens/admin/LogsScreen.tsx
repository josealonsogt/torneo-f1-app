import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { LogAuditoria, obtenerLogsRecientes } from "../../services/logService";

export default function LogsScreen({ navigation }: any) {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarLogs = async () => {
    setCargando(true);
    const logsRecientes = await obtenerLogsRecientes(100); // Últimos 100 logs
    setLogs(logsRecientes);
    setCargando(false);
  };

  useEffect(() => {
    cargarLogs();
  }, []);

  const formatearFecha = (fecha: Date) => {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const segundos = fecha.getSeconds().toString().padStart(2, '0');
    return `${dia}/${mes}/${año} ${hora}:${minutos}:${segundos}`;
  };

  const getColorAccion = (accion: string) => {
    if (accion.includes("ELIMINAR")) return "#e63946";
    if (accion.includes("GENERAR")) return "#00b4d8";
    if (accion.includes("MOVER")) return "#ffa500";
    if (accion.includes("EXPORTAR")) return "#2a9d8f";
    return "#333";
  };

  const getIconoAccion = (accion: string) => {
    if (accion.includes("ELIMINAR")) return "🗑️";
    if (accion.includes("GENERAR")) return "⚙️";
    if (accion.includes("MOVER")) return "🔄";
    if (accion.includes("EXPORTAR")) return "📊";
    return "📝";
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0077b6" />
        <Text style={{ marginTop: 10, color: '#0077b6' }}>Cargando logs...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>📋 Logs de Auditoría</Text>
      <Text style={styles.subtitulo}>Historial de acciones administrativas</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTexto}>
          Total de registros: {logs.length}
        </Text>
      </View>

      {logs.length === 0 ? (
        <Text style={styles.textoVacio}>No hay logs registrados todavía.</Text>
      ) : (
        logs.map((log, index) => (
          <View key={index} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={[styles.logAccion, { color: getColorAccion(log.accion) }]}>
                {getIconoAccion(log.accion)} {log.accion}
              </Text>
              <Text style={styles.logFecha}>
                {formatearFecha(log.fecha)}
              </Text>
            </View>
            
            <Text style={styles.logDetalles}>{log.detalles}</Text>
            
            <Text style={styles.logAdmin}>
              👤 Admin: {log.admin_correo}
            </Text>
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
  subtitulo: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 20 },
  textoVacio: { fontSize: 16, textAlign: "center", color: "#666", marginTop: 40 },
  
  infoBox: {
    backgroundColor: "#e0fbfc",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#0077b6"
  },
  infoTexto: {
    fontSize: 14,
    color: "#0077b6",
    fontWeight: "bold"
  },

  logCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  logAccion: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1
  },
  logFecha: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600"
  },
  logDetalles: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    lineHeight: 20
  },
  logAdmin: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic"
  }
});
