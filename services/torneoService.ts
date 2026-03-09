import { collection, doc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebaseConfig";

// ============================================================================
// 1. CONFIGURACIÓN INICIAL Y CANDADOS
// ============================================================================

export const abrirInscripciones = async (): Promise<boolean> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const qAll = query(carrerasRef);
    const snapshot = await getDocs(qAll);
    const batchBorrado = writeBatch(db);
    snapshot.forEach(docSnap => batchBorrado.delete(docSnap.ref));
    await batchBorrado.commit();

    const batchCreacion = writeBatch(db);
    for (let i = 1; i <= 16; i++) {
      const nuevaCarrera = doc(carrerasRef);
      batchCreacion.set(nuevaCarrera, {
        numero: i,
        fase: "clasificatoria",
        nombre_carrera: `Clasificatoria ${i}`,
        estado: "pendiente",
        participantes: [] 
      });
    }
    await batchCreacion.commit();

    const configRef = doc(db, "configuracion", "torneo");
    await setDoc(configRef, { fase_actual: "clasificatoria" }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error al abrir inscripciones:", error);
    return false;
  }
};

export const setEstadoInscripciones = async (abiertas: boolean): Promise<boolean> => {
  try {
    const configRef = doc(db, "configuracion", "torneo");
    await setDoc(configRef, { inscripciones_abiertas: abiertas }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error cambiando el candado:", error);
    return false;
  }
};

// ============================================================================
// 2. UTILIDADES
// ============================================================================

export const obtenerCarreraDeJugador = async (jugadorId: string): Promise<any | null> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const snapshot = await getDocs(carrerasRef);
    
    for (const documento of snapshot.docs) {
      const carrera = documento.data();
      const participante = carrera.participantes?.find(
        (p: any) => p.jugador_id === jugadorId
      );
      if (participante) {
        return { id: documento.id, ...carrera, mi_posicion: participante.posicion };
      }
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo la carrera:", error);
    return null;
  }
};

// ============================================================================
// 3. GENERADORES ELÁSTICOS (EL MOTOR DEFINITIVO)
// ============================================================================

export const generarSemifinalesA = async (): Promise<boolean> => {
  try {
    // 🆕 Verificar si ya existen
    const qExistentes = query(collection(db, "carreras"), where("fase", "==", "semifinal_a"));
    const existentes = await getDocs(qExistentes);
    if (!existentes.empty) {
      console.warn("Las Semis A ya existen. Usa 'Deshacer Semis' primero.");
      return false;
    }
    
    // 🔥 MAGIA ELÁSTICA: Nos da igual cuántas carreras se jugaron. 
    // Solo buscamos quién tiene el billete para la Semi A.
    const q = query(collection(db, "jugadores"), where("estado_torneo", "==", "clasificado_semi_a"));
    const snapshot = await getDocs(q);
    const clasificados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (clasificados.length === 0) {
      console.warn("No hay ganadores para montar las Semis A.");
      return false;
    }

    // Barajamos para dar emoción
    for (let i = clasificados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clasificados[i], clasificados[j]] = [clasificados[j], clasificados[i]];
    }

    // Partimos a los ganadores por la mitad, sean 16, 8 o 5.
    const mitad = Math.ceil(clasificados.length / 2);
    const semi1 = clasificados.slice(0, mitad);
    const semi2 = clasificados.slice(mitad);

    const batch = writeBatch(db);

    batch.set(doc(collection(db, "carreras")), {
      nombre_carrera: "Semi A 1",
      fase: "semifinal_a",
      estado: "pendiente",
      numero: 101,
      participantes: semi1.map(p => ({ jugador_id: p.id, nombre: p.nombre, posicion: 0 }))
    });

    batch.set(doc(collection(db, "carreras")), {
      nombre_carrera: "Semi A 2",
      fase: "semifinal_a",
      estado: "pendiente",
      numero: 102,
      participantes: semi2.map(p => ({ jugador_id: p.id, nombre: p.nombre, posicion: 0 }))
    });

    const configRef = doc(db, "configuracion", "torneo");
    batch.update(configRef, { fase_actual: "semifinales" });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error generando Semifinales A:", error);
    return false;
  }
};

export const generarSemifinalesB = async (): Promise<boolean> => {
  try {
    // 🆕 Verificar si ya existen
    const qExistentes = query(collection(db, "carreras"), where("fase", "==", "semifinal_b"));
    const existentes = await getDocs(qExistentes);
    if (!existentes.empty) {
      console.warn("Las Semis B ya existen. Usa 'Deshacer Semis' primero.");
      return false;
    }
    
    const q = query(collection(db, "jugadores"), where("estado_torneo", "==", "clasificado_semi_b"));
    const snapshot = await getDocs(q);
    const clasificados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (clasificados.length === 0) return false;

    for (let i = clasificados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clasificados[i], clasificados[j]] = [clasificados[j], clasificados[i]];
    }

    const mitad = Math.ceil(clasificados.length / 2);
    const semi1 = clasificados.slice(0, mitad);
    const semi2 = clasificados.slice(mitad);

    const batch = writeBatch(db);

    batch.set(doc(collection(db, "carreras")), {
      nombre_carrera: "Semi B 1",
      fase: "semifinal_b",
      estado: "pendiente",
      numero: 201,
      participantes: semi1.map(p => ({ jugador_id: p.id, nombre: p.nombre, posicion: 0 }))
    });

    batch.set(doc(collection(db, "carreras")), {
      nombre_carrera: "Semi B 2",
      fase: "semifinal_b",
      estado: "pendiente",
      numero: 202,
      participantes: semi2.map(p => ({ jugador_id: p.id, nombre: p.nombre, posicion: 0 }))
    });

    const configRef = doc(db, "configuracion", "torneo");
    batch.update(configRef, { fase_actual: "semifinales" });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error generando Semifinales B:", error);
    return false;
  }
};

export const generarFinalB = async (): Promise<boolean> => {
  try {
    // 🆕 Check anti-duplicado
    const qExistentes = query(collection(db, "carreras"), where("fase", "==", "final_b"));
    const existentes = await getDocs(qExistentes);
    if (!existentes.empty) {
      console.warn("La Final B ya existe.");
      return false;
    }

    const q = query(collection(db, "jugadores"), where("estado_torneo", "==", "clasificado_final_b"));
    const snapshot = await getDocs(q);
    const clasificados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (clasificados.length === 0) return false;

    for (let i = clasificados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clasificados[i], clasificados[j]] = [clasificados[j], clasificados[i]];
    }

    const batch = writeBatch(db);

    batch.set(doc(collection(db, "carreras")), {
      nombre_carrera: "Final B",
      fase: "final_b",
      estado: "pendiente",
      numero: 301,
      participantes: clasificados.map(p => ({ jugador_id: p.id, nombre: p.nombre, posicion: 0 }))
    });

    const configRef = doc(db, "configuracion", "torneo");
    batch.update(configRef, { fase_actual: "final_b" });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error generando Final B:", error);
    return false;
  }
};

export const generarFinal = async (): Promise<boolean> => {
  try {
    // 🆕 Check anti-duplicado
    const qExistentes = query(collection(db, "carreras"), where("fase", "==", "final"));
    const existentes = await getDocs(qExistentes);
    if (!existentes.empty) {
      console.warn("La Gran Final ya existe.");
      return false;
    }

    const q = query(collection(db, "jugadores"), where("estado_torneo", "==", "finalista"));
    const snapshot = await getDocs(q);
    const clasificados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (clasificados.length === 0) return false;

    for (let i = clasificados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clasificados[i], clasificados[j]] = [clasificados[j], clasificados[i]];
    }

    const batch = writeBatch(db);

    batch.set(doc(collection(db, "carreras")), {
      nombre_carrera: "GRAN FINAL",
      fase: "final",
      estado: "pendiente",
      numero: 401,
      participantes: clasificados.map(p => ({ jugador_id: p.id, nombre: p.nombre, posicion: 0 }))
    });

    const configRef = doc(db, "configuracion", "torneo");
    batch.update(configRef, { fase_actual: "final" });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error generando Gran Final:", error);
    return false;
  }
};