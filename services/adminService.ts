import { collection, doc, getDocs, Timestamp, writeBatch } from "firebase/firestore";
import { Jugador } from "../types/entities";
import { db } from "./firebaseConfig";

export const generarPilotosDePrueba = async (): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const jugadoresRef = collection(db, "jugadores");
    for (let i = 1; i <= 128; i++) {
      const nuevoDocRef = doc(jugadoresRef);
      const piloto: Jugador = {
        nombre: `Piloto Prueba ${i}`, correo: `piloto${i}@test.com`, dni: `TEST-${i}`, estado_torneo: "inscrito", fecha_registro: Timestamp.now(),
      };
      batch.set(nuevoDocRef, piloto);
    }
    await batch.commit();
    return true;
  } catch {
    return false;
  }
};

export const limpiarJugadores = async (): Promise<boolean> => {
  try {
    const jugadoresRef = collection(db, "jugadores");
    const snapshot = await getDocs(jugadoresRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach((documento) => batch.delete(documento.ref));
    await batch.commit();
    return true;

  } catch {
    return false;
  }
};