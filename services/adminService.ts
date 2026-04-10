import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { accederTorneo } from "./authService"; // <-- Asegúrate de que esto se importa arriba
import { db } from "./firebaseConfig";



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


// ----------------------------------------------------------------------
// 8. GENERAR 128 PILOTOS DE PRUEBA (PASANDO POR EL PORTERO)
// ----------------------------------------------------------------------
export const generarPilotosPrueba = async (): Promise<boolean> => {
  try {
    // Vamos a crear 128 pilotos y meterlos por la puerta principal uno a uno
    for (let i = 1; i <= 90; i++) {
      const nombre = `Piloto Bot ${i}`;
      const correo = `bot${i}@test.com`;
      const dni = `${i}`;

      // Hacemos que el bot "inicie sesión" para que el sistema lo asigne mágicamente
      await accederTorneo(nombre, correo, dni);
    }
    return true;
  } catch (error) {
    console.error("Error generando bots:", error);
    return false;
  }
};


export const limpiarCarreras = async (): Promise<boolean> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const snapshot = await getDocs(carrerasRef);
    
    // Borramos todas las carreras de golpe
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();

    // Reiniciamos el estado del torneo a la fase inicial
    const configRef = doc(db, "configuracion", "torneo");
    await setDoc(configRef, { fase_actual: "clasificatoria" }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error limpiando carreras:", error);
    return false;
  }
};