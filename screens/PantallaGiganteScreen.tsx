import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { Carrera } from "../types/entities";

type CarreraOHueco = (Carrera & { id: string }) | { id: string; nombre_carrera: string; vacio: boolean };

export default function PantallaGiganteScreen() {
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const carrerasRef = collection(db, "carreras");
    const unsubscribe = onSnapshot(carrerasRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Carrera & { id: string })[];
      setCarreras(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.textoCargando}>Cargando Circuito...</Text>
      </View>
    );
  }

  const generarHuecos = (fase: string, totalHuecos: number, prefijo: string): CarreraOHueco[] => {
    const carrerasFase = carreras
      .filter(c => c.fase === fase)
      .sort((a, b) => a.numero - b.numero);
    
    const resultado: CarreraOHueco[] = [];
    for (let i = 0; i < totalHuecos; i++) {
      if (carrerasFase[i]) {
        resultado.push(carrerasFase[i]);
      } else {
        let nombreC = `${prefijo} ${i + 1}`;
        if (fase === "final_b") nombreC = "Final B";
        if (fase === "final") nombreC = "Gran Final";
        resultado.push({ id: `hueco-${fase}-${i}`, nombre_carrera: nombreC, vacio: true });
      }
    }
    return resultado;
  };

  const getEstiloPiloto = (fase: string, posicion: number) => {
    let pasa = false;
    if (fase === "clasificatoria" && posicion <= 2) pasa = true; 
    if ((fase === "semifinal_a" || fase === "semifinal_b") && posicion <= 4) pasa = true; 
    if (fase === "final_b" && posicion <= 2) pasa = true; 
    if (fase === "final" && posicion <= 3) pasa = true; 

    return [
      styles.filaPiloto, 
      pasa ? styles.fondoVerde : styles.fondoRojo
    ];
  };

  const RenderTarjeta = ({ item, esGranFinal = false, esCompacta = false }: { item: CarreraOHueco, esGranFinal?: boolean, esCompacta?: boolean }) => {
    // TAMAÑOS DINÁMICOS: Compacta (Clasificatorias) vs Normal vs Gigante (Gran Final)
    const paddingTarjeta = esGranFinal ? 20 : (esCompacta ? 8 : 12);
    const sizeTitulo = esGranFinal ? 20 : (esCompacta ? 13 : 16);
    const sizePiloto = esGranFinal ? 16 : (esCompacta ? 11 : 14);

    if ("vacio" in item) {
      return (
        <View style={[styles.tarjetaVacia, { padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
          <Text style={[styles.nombreCarreraVacia, { fontSize: sizeTitulo }]}>{item.nombre_carrera}</Text>
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>Esperando pilotos...</Text>
        </View>
      );
    }

    const carrera = item as Carrera & { id: string };
    let colorBorde = esGranFinal ? "#ffd700" : "#333";
    if (carrera.estado === "en_curso") colorBorde = "#e63946";
    
    return (
      <View style={[styles.tarjeta, { borderColor: colorBorde, backgroundColor: esGranFinal ? "#1a1a1a" : "#1e1e1e", padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
        <View style={styles.cabeceraTarjeta}>
          <Text style={[styles.nombreCarrera, { color: esGranFinal ? '#ffd700' : '#fff', fontSize: sizeTitulo }]} numberOfLines={1}>
            {esGranFinal ? '🏆 ' : ''}{carrera.nombre_carrera}
          </Text>
          {carrera.estado === "en_curso" && <Text style={styles.estadoEnCurso}>🔴</Text>}
        </View>
        
        {carrera.estado === "finalizada" ? (
          <View style={styles.listaPilotos}>
            {carrera.participantes
              .filter(p => p.posicion >= 1 && p.posicion <= 8)
              .sort((a, b) => a.posicion - b.posicion)
              .map(p => (
                <View key={p.jugador_id} style={[...getEstiloPiloto(carrera.fase, p.posicion), { paddingVertical: esCompacta ? 2 : (esGranFinal ? 6 : 4) }]}>
                  <Text style={[styles.textoPilotoNombre, { fontSize: sizePiloto }]} numberOfLines={1}>
                    <Text style={{fontWeight: 'bold'}}>{p.posicion}º</Text> {p.nombre}
                  </Text>
                </View>
              ))}
          </View>
        ) : (
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>
            {carrera.hora ? `🕒 ${carrera.hora}` : "🕒 Por definir"}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>🏁 JEREZ RACING - CUADRANTE OFICIAL 🏁</Text>
      </View>

      <ScrollView horizontal bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
        <ScrollView bounces={false} contentContainerStyle={styles.board}>
          
          {/* COLUMNA 1: CLASIFICATORIAS (Grid doble) */}
          <View style={styles.columnaAncha}>
            <Text style={styles.tituloColumna}>RONDA 1: CLASIFICATORIAS</Text>
            <View style={styles.gridClasificatorias}>
              {generarHuecos("clasificatoria", 16, "Clasificatoria").map(c => 
                <RenderTarjeta key={c.id} item={c} esCompacta={true} />
              )}
            </View>
          </View>

          {/* COLUMNA 2: SEMIFINALES A y B */}
          <View style={styles.columnaMedia}>
            <View style={styles.mitadSuperior}>
              <Text style={[styles.tituloColumna, {color: '#e63946'}]}>🔥 SEMIFINALES A</Text>
              {generarHuecos("semifinal_a", 2, "Semi A").map(c => <RenderTarjeta key={c.id} item={c} />)}
            </View>
            <View style={styles.mitadInferior}>
              <Text style={[styles.tituloColumna, {color: '#f77f00'}]}>⚡ SEMIFINALES B</Text>
              {generarHuecos("semifinal_b", 2, "Semi B").map(c => <RenderTarjeta key={c.id} item={c} />)}
            </View>
          </View>

          {/* COLUMNA 3: FINAL B (Pegada abajo) */}
          <View style={styles.columnaFinalB}>
            <View style={{ flex: 1 }} /> {/* Espacio vacío arriba para empujar la Final B hacia abajo */}
            <View style={styles.mitadInferior}>
              <Text style={[styles.tituloColumna, {color: '#06ffa5'}]}>🎯 FINAL B</Text>
              {generarHuecos("final_b", 1, "").map(c => <RenderTarjeta key={c.id} item={c} />)}
            </View>
          </View>

          {/* LA FLECHA DIAGONAL ↗ */}
          <View style={styles.columnaFlecha}>
             <Text style={styles.flechaDiagonal}>↗</Text>
          </View>

          {/* COLUMNA 4: LA GRAN FINAL (Gigante y centrada) */}
          <View style={styles.columnaGigante}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.tituloColumna, {color: '#ffd700', fontSize: 22}]}>👑 LA GRAN FINAL 👑</Text>
              {generarHuecos("final", 1, "").map(c => <RenderTarjeta key={c.id} item={c} esGranFinal={true} />)}
            </View>
          </View>

        </ScrollView>
      </ScrollView>

      {/* LEYENDA */}
      <View style={styles.leyenda}>
        <Text style={styles.textoLeyenda}>
          <Text style={{fontWeight: 'bold', color: '#fff'}}>FLUJO:</Text> El <Text style={{color: '#2a9d8f'}}>1º</Text> va a <Text style={{color: '#e63946'}}>Semis A</Text> | El <Text style={{color: '#2a9d8f'}}>2º</Text> va a <Text style={{color: '#f77f00'}}>Semis B</Text> | Top 4 de Semis van a su respectiva Final | <Text style={{color: '#06ffa5'}}>Top 2 Final B</Text> suben a la Gran Final.
        </Text>
        <Text style={{color: '#888', fontSize: 12, marginTop: 4}}>
          🟩 Avanzan de ronda / Podio   |   🟥 Eliminados
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  textoCargando: { color: "#fff", marginTop: 10, fontWeight: "bold" },
  
  header: { backgroundColor: "#000", padding: 10, borderBottomWidth: 2, borderBottomColor: "#e63946", alignItems: "center" },
  titulo: { fontSize: 24, fontWeight: "900", color: "#fff", fontStyle: "italic", letterSpacing: 2 },
  
  board: { flexDirection: "row", padding: 25, flexGrow: 1 },
  
  // ANCHOS Y MÁRGENES ESTIRADOS PARA OCUPAR TODO EL PROYECTOR
  columnaAncha: { width: 460, marginRight: 50 }, 
  columnaMedia: { width: 280, marginRight: 50 },
  columnaFinalB: { width: 280, marginRight: 20 }, // Menos margen para pegarlo a la flecha
  columnaFlecha: { width: 60, justifyContent: 'center', alignItems: 'center', marginRight: 20, paddingTop: 180 }, // El paddingTop baja la flecha para que quede entre la Final B y la Gran Final
  columnaGigante: { width: 380, marginRight: 20 }, // Extra ancha para la caja gigante
  
  gridClasificatorias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  mitadSuperior: { flex: 1, justifyContent: 'center' },
  mitadInferior: { flex: 1, justifyContent: 'center', marginTop: 15 },
  
  tituloColumna: { color: "#aaa", fontSize: 15, fontWeight: "bold", textAlign: "center", marginBottom: 10, letterSpacing: 1 },

  // Estilo de la flecha
  flechaDiagonal: { color: '#666', fontSize: 60, fontWeight: 'bold' },

  tarjeta: { borderRadius: 6, marginBottom: 8, borderWidth: 2 },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nombreCarrera: { color: "#fff", fontWeight: "bold", flex: 1 },
  estadoEnCurso: { color: "#e63946", fontSize: 10, fontWeight: "bold", backgroundColor: "#ffe5e5", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, overflow: 'hidden', marginLeft: 5 },
  
  listaPilotos: { marginTop: 0 },
  filaPiloto: { paddingHorizontal: 6, borderRadius: 3, marginBottom: 2 },
  fondoVerde: { backgroundColor: 'rgba(42, 157, 143, 0.2)', borderLeftWidth: 3, borderLeftColor: '#2a9d8f' }, 
  fondoRojo: { backgroundColor: 'rgba(230, 57, 70, 0.15)', borderLeftWidth: 3, borderLeftColor: '#e63946' }, 
  textoPilotoNombre: { color: "#eee" },
  textoPilotoGris: { color: "#666", fontStyle: "italic", marginTop: 2 },
  
  tarjetaVacia: { backgroundColor: "transparent", borderRadius: 6, marginBottom: 8, borderWidth: 2, borderColor: "#333", borderStyle: 'dashed' },
  nombreCarreraVacia: { color: "#555", fontWeight: "bold", marginBottom: 3 },

  leyenda: { backgroundColor: "#000", padding: 10, borderTopWidth: 1, borderTopColor: "#333", alignItems: "center" },
  textoLeyenda: { color: "#aaa", fontSize: 13, letterSpacing: 0.5 },
});