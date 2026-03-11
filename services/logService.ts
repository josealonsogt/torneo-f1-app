import { addDoc, collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface LogAuditoria {
  fecha: Date;
  admin_correo: string;
  accion: string;
  detalles: string;
}

/**
 * 📝 SERVICIO DE LOGS DE AUDITORÍA
 * Registra todas las acciones administrativas importantes
 */
export async function registrarLog(adminCorreo: string, accion: string, detalles: string) {
  try {
    await addDoc(collection(db, "logs_auditoria"), {
      fecha: new Date(),
      admin_correo: adminCorreo,
      accion: accion,
      detalles: detalles
    });
  } catch (error) {
    console.error("Error al registrar log:", error);
  }
}

/**
 * 📖 OBTENER LOGS RECIENTES
 * Devuelve los últimos N logs de la base de datos
 */
export async function obtenerLogsRecientes(cantidad: number = 50): Promise<LogAuditoria[]> {
  try {
    const logsRef = collection(db, "logs_auditoria");
    const q = query(logsRef, orderBy("fecha", "desc"), limit(cantidad));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      fecha: doc.data().fecha?.toDate() || new Date()
    })) as LogAuditoria[];
  } catch (error) {
    console.error("Error al obtener logs:", error);
    return [];
  }
}
