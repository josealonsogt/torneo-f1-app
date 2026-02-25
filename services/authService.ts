import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { Jugador } from "../types/entities";
import { db } from "./firebaseConfig";

export const accederTorneo = async (nombre: string, correo: string, dni: string): Promise<{ id: string | null; esNuevo: boolean }> => {
  try {
    const jugadoresInscritos = collection(db, "jugadores");
    const q = query(jugadoresInscritos, where("dni", "==", dni));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, esNuevo: false };
    }

    const nuevoJugador: Jugador = {
      nombre, correo, dni, estado_torneo: "inscrito", fecha_registro: Timestamp.now(),
    };
    const docRef = await addDoc(jugadoresInscritos, nuevoJugador);
    return { id: docRef.id, esNuevo: true };
  } catch (error) {
    console.error("Error en accederTorneo:", error);
    return { id: null, esNuevo: false };
  }
};