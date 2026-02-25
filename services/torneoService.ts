import { collection, doc, getDocs, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebaseConfig";

// GENERA LAS 16 CARRERAS CLASIFICATORIAS
export const generarCarrerasClasificatorias = async (): Promise<boolean> => {
  try {
    const jugadoresRef = collection(db, "jugadores");
    const snapshot = await getDocs(jugadoresRef);

    let jugadores: any[] = [];
    snapshot.forEach((documento) => {
      jugadores.push({ id_jugador: documento.id, ...documento.data() });
    });

    if (jugadores.length === 0) return false;

    // Barajar aleatoriamente
    for (let i = jugadores.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [jugadores[i], jugadores[j]] = [jugadores[j], jugadores[i]];
    }

    const batch = writeBatch(db);
    const carrerasRef = collection(db, "carreras");
    let numeroCarrera = 1;

    for (let i = 0; i < jugadores.length; i += 8) {
      const grupo = jugadores.slice(i, i + 8);
      const participantes = grupo.map((jugador) => ({
        jugador_id: jugador.id_jugador,
        nombre: jugador.nombre,
        posicion: 0
      }));

      const nuevaCarreraRef = doc(carrerasRef);
      batch.set(nuevaCarreraRef, {
        nombre_carrera: `Clasificatoria ${numeroCarrera}`,
        fase: "clasificatoria",
        numero: numeroCarrera,
        estado: "pendiente",
        participantes: participantes
      });
      numeroCarrera++;
    }

    await batch.commit();
    
    // Actualizar la fase del torneo
    const torneoRef = doc(db, "configuracion", "torneo");
    const batchConfig = writeBatch(db);
    batchConfig.set(torneoRef, {
      fase_actual: "clasificatorias",
      carreras_generadas: true,
      carrera_en_curso: null
    });
    await batchConfig.commit();
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// OBTENER LA CARRERA DE UN JUGADOR
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
        return {
          id: documento.id,
          ...carrera,
          mi_posicion: participante.posicion
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// GENERAR SEMIFINALES A (con los 1° de clasificatorias)
export const generarSemifinalesA = async (): Promise<boolean> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const snapshot = await getDocs(carrerasRef);
    
    // Filtrar solo clasificatorias finalizadas
    const clasificatorias = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(c => c.fase === "clasificatoria" && c.estado === "finalizada");
    
    if (clasificatorias.length !== 16) {
      return false; // Deben estar las 16 clasificatorias finalizadas
    }
    
    // Obtener los primeros de cada clasificatoria
    const primeros: any[] = [];
    clasificatorias.forEach(carrera => {
      const primero = carrera.participantes.find((p: any) => p.posicion === 1);
      if (primero) primeros.push(primero);
    });
    
    if (primeros.length !== 16) return false;
    
    // Barajar
    for (let i = primeros.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [primeros[i], primeros[j]] = [primeros[j], primeros[i]];
    }
    
    // Crear 2 semifinales de 8 jugadores cada una
    const batch = writeBatch(db);
    
    for (let i = 0; i < 2; i++) {
      const grupo = primeros.slice(i * 8, (i + 1) * 8);
      const participantes = grupo.map(j => ({
        jugador_id: j.jugador_id,
        nombre: j.nombre,
        posicion: 0
      }));
      
      const nuevaCarreraRef = doc(carrerasRef);
      batch.set(nuevaCarreraRef, {
        nombre_carrera: `Semifinal A${i + 1}`,
        fase: "semifinal_a",
        numero: i + 1,
        estado: "pendiente",
        participantes
      });
    }
    
    await batch.commit();
    
    // Actualizar fase del torneo
    const torneoRef = doc(db, "configuracion", "torneo");
    await updateDoc(torneoRef, { fase_actual: "semifinales_a" });
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// GENERAR SEMIFINALES B (con los 2° de clasificatorias)
export const generarSemifinalesB = async (): Promise<boolean> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const snapshot = await getDocs(carrerasRef);
    
    const clasificatorias = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(c => c.fase === "clasificatoria" && c.estado === "finalizada");
    
    if (clasificatorias.length !== 16) return false;
    
    // Obtener los segundos
    const segundos: any[] = [];
    clasificatorias.forEach(carrera => {
      const segundo = carrera.participantes.find((p: any) => p.posicion === 2);
      if (segundo) segundos.push(segundo);
    });
    
    if (segundos.length !== 16) return false;
    
    // Barajar
    for (let i = segundos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [segundos[i], segundos[j]] = [segundos[j], segundos[i]];
    }
    
    // Crear 2 semifinales B
    const batch = writeBatch(db);
    
    for (let i = 0; i < 2; i++) {
      const grupo = segundos.slice(i * 8, (i + 1) * 8);
      const participantes = grupo.map(j => ({
        jugador_id: j.jugador_id,
        nombre: j.nombre,
        posicion: 0
      }));
      
      const nuevaCarreraRef = doc(carrerasRef);
      batch.set(nuevaCarreraRef, {
        nombre_carrera: `Semifinal B${i + 1}`,
        fase: "semifinal_b",
        numero: i + 1,
        estado: "pendiente",
        participantes
      });
    }
    
    await batch.commit();
    
    const torneoRef = doc(db, "configuracion", "torneo");
    await updateDoc(torneoRef, { fase_actual: "semifinales_b" });
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// GENERAR FINAL B (top 4 de cada semifinal B)
export const generarFinalB = async (): Promise<boolean> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const snapshot = await getDocs(carrerasRef);
    
    const semiB = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(c => c.fase === "semifinal_b" && c.estado === "finalizada");
    
    if (semiB.length !== 2) return false;
    
    // Top 4 de cada semifinal B
    const clasificados: any[] = [];
    semiB.forEach(carrera => {
      for (let pos = 1; pos <= 4; pos++) {
        const piloto = carrera.participantes.find((p: any) => p.posicion === pos);
        if (piloto) clasificados.push(piloto);
      }
    });
    
    if (clasificados.length !== 8) return false;
    
    // Barajar
    for (let i = clasificados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clasificados[i], clasificados[j]] = [clasificados[j], clasificados[i]];
    }
    
    const batch = writeBatch(db);
    const nuevaCarreraRef = doc(carrerasRef);
    
    const participantes = clasificados.map(j => ({
      jugador_id: j.jugador_id,
      nombre: j.nombre,
      posicion: 0
    }));
    
    batch.set(nuevaCarreraRef, {
      nombre_carrera: "Final B",
      fase: "final_b",
      numero: 1,
      estado: "pendiente",
      participantes
    });
    
    await batch.commit();
    
    const torneoRef = doc(db, "configuracion", "torneo");
    await updateDoc(torneoRef, { fase_actual: "final_b" });
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// GENERAR FINAL (top 3 de cada semi A + top 2 de final B)
export const generarFinal = async (): Promise<boolean> => {
  try {
    const carrerasRef = collection(db, "carreras");
    const snapshot = await getDocs(carrerasRef);
    
    const semiA = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(c => c.fase === "semifinal_a" && c.estado === "finalizada");
    
    const finalB = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter(c => c.fase === "final_b" && c.estado === "finalizada");
    
    if (semiA.length !== 2 || finalB.length !== 1) return false;
    
    const clasificados: any[] = [];
    
    // Top 3 de cada semifinal A
    semiA.forEach(carrera => {
      for (let pos = 1; pos <= 3; pos++) {
        const piloto = carrera.participantes.find((p: any) => p.posicion === pos);
        if (piloto) clasificados.push(piloto);
      }
    });
    
    // Top 2 de final B
    for (let pos = 1; pos <= 2; pos++) {
      const piloto = finalB[0].participantes.find((p: any) => p.posicion === pos);
      if (piloto) clasificados.push(piloto);
    }
    
    if (clasificados.length !== 8) return false;
    
    // Barajar
    for (let i = clasificados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clasificados[i], clasificados[j]] = [clasificados[j], clasificados[i]];
    }
    
    const batch = writeBatch(db);
    const nuevaCarreraRef = doc(carrerasRef);
    
    const participantes = clasificados.map(j => ({
      jugador_id: j.jugador_id,
      nombre: j.nombre,
      posicion: 0
    }));
    
    batch.set(nuevaCarreraRef, {
      nombre_carrera: "GRAN FINAL",
      fase: "final",
      numero: 1,
      estado: "pendiente",
      participantes
    });
    
    await batch.commit();
    
    const torneoRef = doc(db, "configuracion", "torneo");
    await updateDoc(torneoRef, { fase_actual: "final" });
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
