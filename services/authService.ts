import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, Timestamp, where } from "firebase/firestore";
import { Jugador } from "../types/entities";
import { db } from "./firebaseConfig";

// Hemos añadido "error?: string" en la promesa para poder devolver el mensaje del candado
export const accederTorneo = async (nombre: string, correo: string, dni: string): Promise<{ id: string | null; esNuevo: boolean; error?: string }> => {
  try {
    const jugadoresInscritos = collection(db, "jugadores");
    const q = query(jugadoresInscritos, where("dni", "==", dni));
    const querySnapshot = await getDocs(q);

    // 1. SI EL JUGADOR YA EXISTE:
    // Lo dejamos pasar SIEMPRE. Aunque la puerta esté cerrada, si se le apagó el móvil tiene que poder volver a entrar.
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, esNuevo: false };
    }

    // 2. 🔒 EL PORTERO (CANDADO):
    // Como no existe en la base de datos, es un jugador NUEVO. Comprobamos si las inscripciones siguen abiertas.
    const configRef = doc(db, "configuracion", "torneo");
    const configSnap = await getDoc(configRef);
    if (configSnap.exists() && configSnap.data().inscripciones_abiertas === false) {
      // Si está cerrado, lo bloqueamos y le devolvemos un mensaje de error
      return { id: null, esNuevo: false, error: "Lo sentimos, las inscripciones ya están cerradas." };
    }

    // 3. SI LA PUERTA ESTÁ ABIERTA: Lo registramos en la base de datos
    const nuevoJugador: Jugador = {
      nombre, correo, dni, estado_torneo: "inscrito", fecha_registro: Timestamp.now(),
    };
    const docRef = await addDoc(jugadoresInscritos, nuevoJugador);

    // ----------------------------------------------------------------
    // 🚨 REPARTO EN BLOQUES Y BUSCADOR DE HUECOS 🚨
    // ----------------------------------------------------------------
    const carrerasRef = collection(db, "carreras");
    const qCarreras = query(carrerasRef, where("fase", "==", "clasificatoria"));
    const snapshotCarreras = await getDocs(qCarreras);

    let carreras = snapshotCarreras.docs.map(c => ({ id: c.id, ...c.data() as any }));
    carreras.sort((a, b) => a.numero - b.numero);

    const TAMANO_BLOQUE = 4; // Bloques de 4 carreras (32 personas)
    let carreraAsignada = null;

    for (let i = 0; i < carreras.length; i += TAMANO_BLOQUE) {
      const bloque = carreras.slice(i, i + TAMANO_BLOQUE);
      const bloqueLleno = bloque.every(c => (c.participantes?.length || 0) >= 8);

      if (!bloqueLleno) {
        carreraAsignada = bloque.reduce((prev, curr) => {
          if ((curr.participantes?.length || 0) >= 8) return prev;
          if ((prev.participantes?.length || 0) >= 8) return curr;
          return (prev.participantes?.length || 0) <= (curr.participantes?.length || 0) ? prev : curr;
        });
        break; 
      }
    }

    // ----------------------------------------------------------------
    // 🔒 EL CANDADO DE SEGURIDAD (TRANSACCIÓN CONTRA AVALANCHAS) 🔒
    // ----------------------------------------------------------------
    if (carreraAsignada) {
      const carreraRef = doc(db, "carreras", carreraAsignada.id);

      try {
        await runTransaction(db, async (transaction) => {
          const carreraDoc = await transaction.get(carreraRef);
          if (!carreraDoc.exists()) throw new Error("Carrera no existe");

          const participantesActuales = carreraDoc.data().participantes || [];

          // Comprobación ESTRICTA en tiempo real
          if (participantesActuales.length < 8) {
            const nuevosParticipantes = [...participantesActuales, {
              jugador_id: docRef.id,
              nombre: nombre,
              posicion: 0
            }];
            transaction.update(carreraRef, { participantes: nuevosParticipantes });
          } else {
            throw new Error("Carrera llenada en el último milisegundo");
          }
        });
      } catch (transactionError) {
        console.warn("Overbooking evitado:", transactionError);
      }
    }

    return { id: docRef.id, esNuevo: true };

  } catch (error) {
    console.error("Error en accederTorneo:", error);
    return { id: null, esNuevo: false, error: "Error de conexión con el servidor." };
  }
};