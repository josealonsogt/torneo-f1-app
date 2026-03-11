import { addDoc, collection, doc, getDoc, getDocs, query, runTransaction, Timestamp, where } from "firebase/firestore";
import { TorneoConfig } from "../config/torneoConfig"; // 👈 Importamos el cerebro
import { Jugador } from "../types/entities";
import { db } from "./firebaseConfig";

export const accederTorneo = async (nombre: string, correo: string, dni: string): Promise<{ 
  id: string | null; 
  esNuevo: boolean; 
  error?: string; 
  carreraAsignada?: { nombre: string; numero: number } 
}> => {
  try {
    const jugadoresInscritos = collection(db, "jugadores");
    const q = query(jugadoresInscritos, where("dni", "==", dni));
    const querySnapshot = await getDocs(q);

    // ==========================================
    // 1. REINGRESO (Piloto ya registrado)
    // ==========================================
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, esNuevo: false };
    }

    // ==========================================
    // 2. CONTROL DE ACCESO (¿Están abiertas?)
    // ==========================================
    const configRef = doc(db, "configuracion", "torneo");
    const configSnap = await getDoc(configRef);
    if (configSnap.exists() && configSnap.data().inscripciones_abiertas === false) {
      return { id: null, esNuevo: false, error: "🔒 INSCRIPCIONES CERRADAS\n\nActualmente el torneo no está aceptando nuevos pilotos. Las inscripciones están temporalmente cerradas por la organización.\n\nContacta con el equipo si necesitas más información." };
    }

    // ==========================================
    // 2.5 🚨 VERIFICAR LÍMITE MÁXIMO (128 PLAZAS)
    // ==========================================
    const carrerasRef = collection(db, "carreras");
    const qCarreras = query(carrerasRef, where("fase", "==", "clasificatoria"));
    const snapshotCarreras = await getDocs(qCarreras);

    let carreras = snapshotCarreras.docs
      .map(c => ({ id: c.id, ...c.data() as any }))
      .filter(c => c.estado !== "finalizada");
    
    // Contar plazas ocupadas en total
    const plazasOcupadas = carreras.reduce((total, carrera) => {
      return total + (carrera.participantes?.length || 0);
    }, 0);

    const MAX_PILOTOS = TorneoConfig.maxParticipantesPorCarrera;
    const LIMITE_TOTAL = carreras.length * MAX_PILOTOS; // 16 carreras × 8 = 128

    if (plazasOcupadas >= LIMITE_TOTAL) {
      return { 
        id: null, 
        esNuevo: false, 
        error: `🏁 PARRILLA COMPLETA\n\nEl torneo ha alcanzado su capacidad máxima de ${LIMITE_TOTAL} pilotos. Todas las plazas están ocupadas.\n\nContacta con la organización para entrar en lista de espera.` 
      };
    }

    // ==========================================
    // 3. REGISTRO DE NUEVO PILOTO
    // ==========================================
    const nuevoJugador: Jugador = {
      nombre, correo, dni, estado_torneo: "inscrito", fecha_registro: Timestamp.now(),
    };
    const docRef = await addDoc(jugadoresInscritos, nuevoJugador);

    // ==========================================
    // 4. ALGORITMO DE REPARTO DE HUECOS (Mejorado)
    // ==========================================
    carreras.sort((a, b) => a.numero - b.numero);
    const TAMANO_BLOQUE = TorneoConfig.carrerasPorBloque; 
    
    let carreraAsignada = null;

    // Buscar el primer bloque que no esté lleno
    for (let i = 0; i < carreras.length; i += TAMANO_BLOQUE) {
      const bloque = carreras.slice(i, i + TAMANO_BLOQUE);
      const bloqueLleno = bloque.every(c => (c.participantes?.length || 0) >= MAX_PILOTOS);

      if (!bloqueLleno) {
        // Dentro del bloque, buscar la carrera con menos pilotos
        carreraAsignada = bloque.reduce((prev, curr) => {
          const prevCount = prev.participantes?.length || 0;
          const currCount = curr.participantes?.length || 0;
          
          // Si la anterior está llena, devolver la actual
          if (prevCount >= MAX_PILOTOS) return curr;
          // Si la actual está llena, devolver la anterior
          if (currCount >= MAX_PILOTOS) return prev;
          // Sino, devolver la que tenga menos pilotos
          return prevCount <= currCount ? prev : curr;
        });
        break; 
      }
    }

    // 🚨 Si no se encontró carrera (no debería pasar por el check anterior, pero por si acaso)
    if (!carreraAsignada) {
      console.error("❌ ERROR CRÍTICO: No se encontró carrera disponible pero plazas < límite");
      return {
        id: docRef.id,
        esNuevo: true,
        error: "⚠️ INSCRIPCIÓN CONFIRMADA\n\nTe has registrado correctamente, pero debido a la alta demanda no hemos podido asignarte automáticamente a una carrera.\n\nLa organización te asignará manualmente en breve. Recibirás confirmación por email."
      };
    }

    // ==========================================
    // 5. BLOQUEO DE OVERBOOKING (Transacción)
    // ==========================================
    const carreraRef = doc(db, "carreras", carreraAsignada.id);
    let asignacionExitosa = false;

    try {
      await runTransaction(db, async (transaction) => {
        const carreraDoc = await transaction.get(carreraRef);
        if (!carreraDoc.exists()) throw new Error("Carrera no existe");

        const datosCarrera = carreraDoc.data(); 
        const participantesActuales = datosCarrera.participantes || [];

        if (datosCarrera.estado === "finalizada") throw new Error("Carrera ya finalizada");

        // Control estricto de límite
        if (participantesActuales.length < MAX_PILOTOS) {
          const nuevosParticipantes = [...participantesActuales, {
            jugador_id: docRef.id,
            nombre: nombre,
            posicion: 0
          }];
          transaction.update(carreraRef, { participantes: nuevosParticipantes });
          asignacionExitosa = true;
        } else {
          throw new Error("Carrera llenada en el último milisegundo");
        }
      });
    } catch (transactionError) {
      console.warn("⚠️ Overbooking evitado o error en transacción:", transactionError);
      asignacionExitosa = false;
    }

    // Si la transacción falló, el piloto se registró pero quedó sin carrera
    if (!asignacionExitosa) {
      return {
        id: docRef.id,
        esNuevo: true,
        error: "⚠️ INSCRIPCIÓN CONFIRMADA\n\nTe has registrado correctamente, pero debido a la alta demanda no hemos podido asignarte automáticamente a una carrera.\n\nLa organización te asignará manualmente en breve. Recibirás confirmación por email."
      };
    }

    return { 
      id: docRef.id, 
      esNuevo: true,
      carreraAsignada: {
        nombre: carreraAsignada.nombre_carrera,
        numero: carreraAsignada.numero
      }
    };

  } catch (error) {
    console.error("Error crítico en accederTorneo:", error);
    return { id: null, esNuevo: false, error: "❌ ERROR DE CONEXIÓN\n\nNo hemos podido conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo." };
  }
};