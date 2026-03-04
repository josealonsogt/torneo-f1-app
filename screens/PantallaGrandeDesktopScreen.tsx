import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { Carrera } from "../types/entities";

type CarreraOHueco = (Carrera & { id: string }) | { id: string; nombre_carrera: string; vacio: boolean };

export default function PantallaGrandeDesktopScreen() {
  const navigation = useNavigation();
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [zoom, setZoom] = useState(1); // Zoom normal para desktop

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
        <Text style={styles.textoCargando}>CARGANDO DATOS DE PISTA...</Text>
      </View>
    );
  }

  const aumentarZoom = () => {
    if (zoom < 2) setZoom(zoom + 0.25);
  };

  const reducirZoom = () => {
    if (zoom > 0.5) setZoom(zoom - 0.25);
  };

  const resetearZoom = () => {
    setZoom(1);
  };

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
        if (fase === "final_b") nombreC = "FINAL B";
        if (fase === "final") nombreC = "GRAN FINAL";
        resultado.push({ id: `hueco-${fase}-${i}`, nombre_carrera: nombreC, vacio: true });
      }
    }
    return resultado;
  };

  const getEstiloPiloto = (fase: string, posicion: number) => {
    let pasa = false;
    if (fase === "clasificatoria" && posicion <= 2) pasa = true; 
    if (fase === "semifinal_a" && posicion <= 3) pasa = true; 
    if (fase === "semifinal_b" && posicion <= 4) pasa = true; 
    if (fase === "final_b" && posicion <= 2) pasa = true; 
    if (fase === "final" && posicion <= 3) pasa = true; 

    return [
      styles.filaPiloto, 
      pasa ? styles.fondoVerde : styles.fondoRojo
    ];
  };

  const RenderTarjeta = ({ item, esGranFinal = false, esCompacta = false }: { item: CarreraOHueco, esGranFinal?: boolean, esCompacta?: boolean }) => {
    const paddingTarjeta = esGranFinal ? 25 : (esCompacta ? 12 : 18);
    const sizeTitulo = esGranFinal ? 18 : (esCompacta ? 12 : 15);
    const sizePiloto = esGranFinal ? 16 : (esCompacta ? 11 : 13);

    if ("vacio" in item) {
      return (
        <View style={[styles.tarjetaVacia, { padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
          <Text style={[styles.nombreCarreraVacia, { fontSize: sizeTitulo }]}>{item.nombre_carrera.toUpperCase()}</Text>
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>[ ESPERANDO PILOTOS ]</Text>
        </View>
      );
    }

    const carrera = item as Carrera & { id: string };
    let colorBorde = esGranFinal ? "#ffd700" : "#333";
    if (carrera.estado === "en_curso") colorBorde = "#e63946";
    
    return (
      <View style={[styles.tarjeta, { borderColor: colorBorde, backgroundColor: esGranFinal ? "#151515" : "#1a1a1a", padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
        <View style={styles.cabeceraTarjeta}>
          <Text style={[styles.nombreCarrera, { color: esGranFinal ? '#ffd700' : '#fff', fontSize: sizeTitulo }]} numberOfLines={1}>
            {carrera.nombre_carrera.toUpperCase()}
          </Text>
          {carrera.estado === "en_curso" && <View style={styles.badgeLive}><Text style={styles.estadoEnCurso}>LIVE</Text></View>}
        </View>
        
        {carrera.estado === "finalizada" ? (
          <View style={styles.listaPilotos}>
            {carrera.participantes
              .filter(p => p.posicion >= 1 && p.posicion <= 8)
              .sort((a, b) => a.posicion - b.posicion)
              .map(p => (
                <View key={p.jugador_id} style={[...getEstiloPiloto(carrera.fase, p.posicion), { paddingVertical: esCompacta ? 4 : (esGranFinal ? 8 : 6) }]}>
                  <Text style={[styles.textoPilotoNombre, { fontSize: sizePiloto }]} numberOfLines={1}>
                    <Text style={{fontWeight: '900', color: p.posicion === 1 && esGranFinal ? '#ffd700' : '#fff'}}>P{p.posicion}</Text>  {p.nombre.toUpperCase()}
                  </Text>
                </View>
              ))}
          </View>
        ) : (
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>
            {carrera.hora ? `Hora: ${carrera.hora}` : "Hora: No definida"}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER CON CONTROLES DE ZOOM */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <Text style={styles.textoBotonVolver}>◀ VOLVER</Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.titulo}>MATSURI RACING | CUADRANTE OFICIAL</Text>
          <Text style={styles.ayudaZoom}>Zoom: {Math.round(zoom * 100)}%</Text>
        </View>
        
        <View style={styles.controlesZoom}>
          <TouchableOpacity 
            style={[styles.botonZoom, zoom >= 2 && styles.botonZoomDesactivado]} 
            onPress={aumentarZoom}
            disabled={zoom >= 2}
          >
            <Ionicons name="add" size={24} color={zoom >= 2 ? "#555" : "#ffd700"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.botonZoom} 
            onPress={resetearZoom}
          >
            <Text style={styles.textoResetZoom}>100%</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.botonZoom, zoom <= 0.5 && styles.botonZoomDesactivado]} 
            onPress={reducirZoom}
            disabled={zoom <= 0.5}
          >
            <Ionicons name="remove" size={24} color={zoom <= 0.5 ? "#555" : "#ffd700"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        bounces={false} 
        contentContainerStyle={{ flexGrow: 1 }}
        showsHorizontalScrollIndicator={true}
      >
        <ScrollView 
          bounces={false} 
          contentContainerStyle={[styles.board, { transform: [{ scale: zoom }] }]}
          showsVerticalScrollIndicator={true}
        >
          
          {/* COLUMNA 1: CLASIFICATORIAS */}
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
              <Text style={[styles.tituloColumna, {color: '#e63946'}]}>SEMIFINALES A</Text>
              {generarHuecos("semifinal_a", 2, "Semi A").map(c => <RenderTarjeta key={c.id} item={c} />)}
            </View>
            <View style={styles.mitadInferior}>
              <Text style={[styles.tituloColumna, {color: '#f77f00'}]}>SEMIFINALES B</Text>
              {generarHuecos("semifinal_b", 2, "Semi B").map(c => <RenderTarjeta key={c.id} item={c} />)}
            </View>
          </View>

          {/* COLUMNA 3: FINAL B */}
          <View style={styles.columnaFinalB}>
            <View style={{ flex: 1 }} /> 
            <View style={styles.mitadInferior}>
              <Text style={[styles.tituloColumna, {color: '#06ffa5'}]}>REPESCA (FINAL B)</Text>
              {generarHuecos("final_b", 1, "").map(c => <RenderTarjeta key={c.id} item={c} />)}
            </View>
          </View>

          {/* COLUMNA 4: LA GRAN FINAL */}
          <View style={styles.columnaGigante}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={[styles.tituloColumna, {color: '#ffd700', fontSize: 24, marginBottom: 20}]}>LA GRAN FINAL</Text>
              {generarHuecos("final", 1, "").map(c => <RenderTarjeta key={c.id} item={c} esGranFinal={true} />)}
            </View>
          </View>

        </ScrollView>
      </ScrollView>

      {/* LEYENDA COMPLETA */}
      <View style={styles.leyenda}>
        <Text style={styles.leyendaTitulo}>REGLAMENTO DE PROGRESIÓN:</Text>
        <View style={styles.reglasContainer}>
          <View style={styles.reglaItem}>
            <View style={[styles.badge, {backgroundColor: '#e63946'}]}>
              <Text style={styles.badgeTexto}>P1</Text>
            </View>
            <Text style={styles.textoRegla}>Clasificatorias → Semifinal A</Text>
          </View>
          
          <View style={styles.reglaItem}>
            <View style={[styles.badge, {backgroundColor: '#f77f00'}]}>
              <Text style={styles.badgeTexto}>P2</Text>
            </View>
            <Text style={styles.textoRegla}>Clasificatorias → Semifinal B</Text>
          </View>
          
          <View style={styles.reglaItem}>
            <View style={[styles.badge, {backgroundColor: '#ffd700'}]}>
              <Text style={[styles.badgeTexto, {color: '#000'}]}>TOP 3</Text>
            </View>
            <Text style={styles.textoRegla}>Semifinal A → Gran Final</Text>
          </View>
          
          <View style={styles.reglaItem}>
            <View style={[styles.badge, {backgroundColor: '#06ffa5'}]}>
              <Text style={[styles.badgeTexto, {color: '#000'}]}>TOP 4</Text>
            </View>
            <Text style={styles.textoRegla}>Semifinal B → Final B</Text>
          </View>
          
          <View style={styles.reglaItem}>
            <View style={[styles.badge, {backgroundColor: '#2a9d8f'}]}>
              <Text style={styles.badgeTexto}>TOP 2</Text>
            </View>
            <Text style={styles.textoRegla}>Final B → Gran Final</Text>
          </View>
        </View>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" },
  textoCargando: { color: "#e63946", marginTop: 15, fontWeight: "900", letterSpacing: 2, fontSize: 14 },
  
  // HEADER
  header: { 
    flexDirection: 'row', 
    backgroundColor: "#111", 
    padding: 20, 
    borderBottomWidth: 2, 
    borderBottomColor: "#333", 
    alignItems: "center",
    justifyContent: "space-between" 
  },
  botonVolver: { paddingVertical: 8, paddingHorizontal: 12 },
  textoBotonVolver: { color: "#e63946", fontWeight: "900", fontSize: 14, letterSpacing: 1 },
  titulo: { fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: 3, textAlign: "center" },
  ayudaZoom: { fontSize: 12, color: "#ffd700", marginTop: 4, letterSpacing: 1, fontWeight: 'bold' },
  
  controlesZoom: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  botonZoom: { 
    width: 44, 
    height: 44, 
    backgroundColor: '#222', 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: '#ffd700',
    alignItems: 'center',
    justifyContent: 'center'
  },
  botonZoomDesactivado: { 
    borderColor: '#333',
    backgroundColor: '#1a1a1a'
  },
  textoResetZoom: { color: '#ffd700', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  // BOARD LAYOUT (OPTIMIZADO DESKTOP)
  board: { flexDirection: "row", padding: 25, flexGrow: 1 },
  columnaAncha: { width: 440, marginRight: 30 }, 
  columnaMedia: { width: 280, marginRight: 30 },
  columnaFinalB: { width: 280, marginRight: 30 }, 
  columnaGigante: { width: 340, marginRight: 20 }, 
  gridClasificatorias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mitadSuperior: { flex: 1, justifyContent: 'center' },
  mitadInferior: { flex: 1, justifyContent: 'center', marginTop: 20 },
  
  tituloColumna: { color: "#888", fontSize: 13, fontWeight: "900", textAlign: "center", marginBottom: 15, letterSpacing: 2 },
  
  // TARJETAS
  tarjeta: { borderRadius: 4, marginBottom: 12, borderWidth: 1 },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
  nombreCarrera: { color: "#fff", fontWeight: "900", flex: 1, letterSpacing: 1 },
  
  badgeLive: { backgroundColor: 'rgba(230, 57, 70, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 1, borderColor: '#e63946' },
  estadoEnCurso: { color: "#e63946", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  
  // LISTA PILOTOS
  listaPilotos: { marginTop: 0 },
  filaPiloto: { paddingHorizontal: 10, borderRadius: 3, marginBottom: 3 },
  fondoVerde: { backgroundColor: 'rgba(42, 157, 143, 0.1)', borderLeftWidth: 3, borderLeftColor: '#2a9d8f' }, 
  fondoRojo: { backgroundColor: 'rgba(230, 57, 70, 0.05)', borderLeftWidth: 3, borderLeftColor: '#e63946' }, 
  textoPilotoNombre: { color: "#ccc", fontWeight: "600", letterSpacing: 0.5 },
  
  textoPilotoGris: { color: "#555", fontStyle: "italic", marginTop: 3, fontSize: 12, letterSpacing: 1 },
  tarjetaVacia: { backgroundColor: "transparent", borderRadius: 4, marginBottom: 12, borderWidth: 1, borderColor: "#333", borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  nombreCarreraVacia: { color: "#666", fontWeight: "900", marginBottom: 5, letterSpacing: 1 },

  // LEYENDA COMPLETA
  leyenda: { 
    backgroundColor: "#111", 
    paddingVertical: 20, 
    paddingHorizontal: 30, 
    borderTopWidth: 3, 
    borderTopColor: "#ffd700" 
  },
  leyendaTitulo: { 
    color: '#ffd700', 
    fontSize: 14, 
    fontWeight: '900', 
    letterSpacing: 2, 
    marginBottom: 15,
    textAlign: 'center'
  },
  reglasContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 20
  },
  reglaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center'
  },
  badgeTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  textoRegla: {
    color: '#ccc',
    fontSize: 13,
    letterSpacing: 0.5
  }
});
