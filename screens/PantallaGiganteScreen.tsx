import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "../services/firebaseConfig";
import { Carrera } from "../types/entities";

type CarreraOHueco = (Carrera & { id: string }) | { id: string; nombre_carrera: string; vacio: boolean };

export default function PantallaGiganteScreen() {
  const navigation = useNavigation();
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [zoom, setZoom] = useState(0.85); 

  // 🚫 ELIMINA LA BARRA BLANCA SUPERIOR
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
      <LinearGradient colors={['#050814', '#170c2b', '#481f5c']} style={styles.center}>
        <ActivityIndicator size="large" color="#8b48ba" />
        <Text style={styles.textoCargando}>CARGANDO DATOS DE PISTA...</Text>
      </LinearGradient>
    );
  }

  const aumentarZoom = () => { if (zoom < 2) setZoom(zoom + 0.25); };
  const reducirZoom = () => { if (zoom > 0.5) setZoom(zoom - 0.25); };
  const resetearZoom = () => { setZoom(1); };

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

    // Colores corporativos para el "Pasa/No Pasa"
    return [
      styles.filaPiloto, 
      pasa ? styles.fondoVerde : styles.fondoRojo
    ];
  };

  const RenderTarjeta = ({ item, esGranFinal = false, esCompacta = false }: { item: CarreraOHueco, esGranFinal?: boolean, esCompacta?: boolean }) => {
    const paddingTarjeta = esGranFinal ? 15 : (esCompacta ? 6 : 10);
    const sizeTitulo = esGranFinal ? 14 : (esCompacta ? 10 : 12);
    const sizePiloto = esGranFinal ? 12 : (esCompacta ? 9 : 11);

    if ("vacio" in item) {
      return (
        <View style={[styles.tarjetaVacia, { padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
          <Text style={[styles.nombreCarreraVacia, { fontSize: sizeTitulo }]}>{item.nombre_carrera.toUpperCase()}</Text>
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>[ ESPERANDO PILOTOS ]</Text>
        </View>
      );
    }

    const carrera = item as Carrera & { id: string };
    let colorBorde = esGranFinal ? "#ffd700" : "rgba(255, 255, 255, 0.1)";
    if (carrera.estado === "en_curso") colorBorde = "#e63946";
    
    return (
      <View style={[styles.tarjetaCristal, { borderColor: colorBorde, padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
        <View style={styles.cabeceraTarjeta}>
          <Text style={[styles.nombreCarrera, { color: esGranFinal ? '#ffd700' : '#00f0ff', fontSize: sizeTitulo }]} numberOfLines={1}>
            {carrera.nombre_carrera.toUpperCase()}
          </Text>
          {carrera.estado === "en_curso" && <View style={styles.badgeLive}><View style={styles.puntoRojo}/><Text style={styles.estadoEnCurso}>LIVE</Text></View>}
        </View>
        
        {carrera.estado === "finalizada" ? (
          <View style={styles.listaPilotos}>
            {carrera.participantes
              .filter(p => p.posicion >= 1 && p.posicion <= 8)
              .sort((a, b) => a.posicion - b.posicion)
              .map(p => {
                let colorOro = p.posicion === 1 && esGranFinal ? '#ffd700' : '#fff';
                return(
                <View key={p.jugador_id} style={[...getEstiloPiloto(carrera.fase, p.posicion), { paddingVertical: esCompacta ? 2 : (esGranFinal ? 6 : 4) }]}>
                  <Text 
                    style={[styles.textoPilotoNombre, { fontSize: sizePiloto }]} 
                    numberOfLines={esCompacta ? 1 : 2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    <Text style={{fontWeight: '900', color: colorOro}}>
                      P{p.posicion}
                    </Text>{"  "}{p.nombre.toUpperCase()}
                  </Text>
                </View>
              )})}
          </View>
        ) : (
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>
            <Ionicons name="time-outline" size={sizePiloto} color="#8b48ba"/> {carrera.hora ? carrera.hora : "No definida"}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#050814', '#170c2b', '#1a0524']} // Fondo oscuro para que no moleste a la vista el cuadro gigante
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}}>
        
        {/* 👑 HEADER CON CONTROLES DE ZOOM */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
             <Ionicons name="chevron-back" size={24} color="#e1e1e1" />
             <Text style={styles.textoBotonVolver}>BOX</Text>
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image 
                source={require('../assets/Logo Kaizo Sim blanco.png')} 
                style={styles.logoPequeño}
                resizeMode="contain"
            />
            <Text style={styles.ayudaZoom}>ZOOM: {Math.round(zoom * 100)}%</Text>
          </View>
          
          <View style={styles.controlesZoom}>
            <TouchableOpacity style={[styles.botonZoom, zoom >= 2 && styles.botonZoomDesactivado]} onPress={aumentarZoom} disabled={zoom >= 2}>
              <Ionicons name="add" size={18} color={zoom >= 2 ? "#555" : "#e1e1e1"} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.botonZoom100} onPress={resetearZoom}>
              <Text style={styles.textoResetZoom}>100%</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.botonZoom, zoom <= 0.5 && styles.botonZoomDesactivado]} onPress={reducirZoom} disabled={zoom <= 0.5}>
              <Ionicons name="remove" size={18} color={zoom <= 0.5 ? "#555" : "#e1e1e1"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🗺️ ZONA DEL BRACKET (DOBLE SCROLL) */}
        <ScrollView horizontal bounces={false} contentContainerStyle={{ flexGrow: 1 }} showsHorizontalScrollIndicator={true}>
          <ScrollView bounces={false} contentContainerStyle={[styles.board, { transform: [{ scale: zoom }] }]} showsVerticalScrollIndicator={true}>
            
            <View style={styles.columnaAncha}>
              <Text style={styles.tituloColumna}>RONDA 1: CLASIFICATORIAS</Text>
              <View style={styles.gridClasificatorias}>
                {generarHuecos("clasificatoria", 16, "Clasificatoria").map(c => <RenderTarjeta key={c.id} item={c} esCompacta={true} />)}
              </View>
            </View>

            <View style={styles.columnaMedia}>
              <View style={styles.mitadSuperior}>
                <Text style={[styles.tituloColumna, {color: '#8b48ba'}]}>SEMIFINALES A</Text>
                {generarHuecos("semifinal_a", 2, "Semi A").map(c => <RenderTarjeta key={c.id} item={c} />)}
              </View>
              <View style={styles.mitadInferior}>
                <Text style={[styles.tituloColumna, {color: '#8b48ba'}]}>SEMIFINALES B</Text>
                {generarHuecos("semifinal_b", 2, "Semi B").map(c => <RenderTarjeta key={c.id} item={c} />)}
              </View>
            </View>

            <View style={styles.columnaFinalB}>
              <View style={{ flex: 1 }} /> 
              <View style={styles.mitadInferior}>
                <Text style={[styles.tituloColumna, {color: '#00f0ff'}]}>REPESCA (FINAL B)</Text>
                {generarHuecos("final_b", 1, "").map(c => <RenderTarjeta key={c.id} item={c} />)}
              </View>
            </View>

            <View style={styles.columnaGigante}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[styles.tituloColumna, {color: '#ffd700', fontSize: 20}]}>LA GRAN FINAL</Text>
                {generarHuecos("final", 1, "").map(c => <RenderTarjeta key={c.id} item={c} esGranFinal={true} />)}
              </View>
            </View>

          </ScrollView>
        </ScrollView>

        {/* 📜 LEYENDA INFERIOR */}
        <View style={styles.leyenda}>
          <Text style={styles.leyendaTitulo}>REGLAS:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.reglasContainer}>
              <Text style={styles.textoReglaCompacta}><Text style={styles.posDestacada}>P1</Text>→<Text style={styles.faseA}>A</Text></Text>
              <View style={styles.separador} />
              <Text style={styles.textoReglaCompacta}><Text style={styles.posDestacada}>P2</Text>→<Text style={styles.faseB}>B</Text></Text>
              <View style={styles.separador} />
              <Text style={styles.textoReglaCompacta}><Text style={styles.posDestacada}>Top3</Text> A→<Text style={styles.faseFinal}>Final</Text></Text>
              <View style={styles.separador} />
              <Text style={styles.textoReglaCompacta}><Text style={styles.posDestacada}>Top4</Text> B→<Text style={styles.faseFinalB}>FB</Text></Text>
              <View style={styles.separador} />
              <Text style={styles.textoReglaCompacta}><Text style={styles.posDestacada}>Top2</Text> FB→<Text style={styles.faseFinal}>Final</Text></Text>
            </View>
          </ScrollView>
        </View>
        
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoCargando: { color: "#fff", marginTop: 15, fontWeight: "900", letterSpacing: 2, fontSize: 12 },
  
  // HEADER
  header: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    paddingHorizontal: 10, 
    paddingTop: 15, // Notch
    paddingBottom: 15,
    borderBottomWidth: 1, 
    borderBottomColor: "rgba(255,255,255,0.05)", 
    alignItems: "center",
    justifyContent: "space-between" 
  },
  botonVolver: { flexDirection: 'row', alignItems: 'center', width: 80 },
  textoBotonVolver: { color: "#e1e1e1", fontWeight: "bold", fontSize: 12, letterSpacing: 1 },
  logoPequeño: { width: 90, height: 25 },
  ayudaZoom: { fontSize: 9, color: "#8b48ba", marginTop: 2, letterSpacing: 1, fontWeight: 'bold' },
  
  // CONTROLES ZOOM
  controlesZoom: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  botonZoom: { 
    width: 28, height: 28, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 6, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center'
  },
  botonZoom100: {
    paddingHorizontal: 8, height: 28,
    backgroundColor: 'rgba(104, 53, 140, 0.4)', // Morado Kaizō
    borderRadius: 6, 
    borderWidth: 1, borderColor: '#8b48ba',
    alignItems: 'center', justifyContent: 'center'
  },
  botonZoomDesactivado: { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent' },
  textoResetZoom: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  
  // BOARD LAYOUT
  board: { flexDirection: "row", padding: 20, flexGrow: 1 },
  columnaAncha: { width: 220, marginRight: 15 }, 
  columnaMedia: { width: 150, marginRight: 15 },
  columnaFinalB: { width: 150, marginRight: 15 }, 
  columnaGigante: { width: 190, marginRight: 10 }, 
  gridClasificatorias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mitadSuperior: { flex: 1, justifyContent: 'center' },
  mitadInferior: { flex: 1, justifyContent: 'center', marginTop: 15 },
  
  tituloColumna: { color: "#e1e1e1", fontSize: 10, fontWeight: "900", textAlign: "center", marginBottom: 12, letterSpacing: 2 },
  
  // TARJETAS (GLASSMORPHISM)
  tarjetaCristal: { 
    backgroundColor: 'rgba(12, 12, 15, 0.8)', 
    borderRadius: 6, 
    marginBottom: 8, 
    borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 5
  },
  tarjetaVacia: { 
    backgroundColor: "transparent", 
    borderRadius: 6, marginBottom: 8, 
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: 'dashed', 
    alignItems: 'center', justifyContent: 'center' 
  },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  nombreCarrera: { fontWeight: "900", flex: 1, letterSpacing: 0.5 },
  nombreCarreraVacia: { color: "#555", fontWeight: "900", marginBottom: 3, letterSpacing: 0.5 },
  
  badgeLive: { flexDirection: 'row', alignItems: 'center', gap:4, backgroundColor: 'rgba(230, 57, 70, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, borderWidth: 1, borderColor: '#e63946' },
  puntoRojo: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  estadoEnCurso: { color: "#e63946", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  
  // LISTA PILOTOS
  listaPilotos: { marginTop: 0 },
  filaPiloto: { paddingHorizontal: 6, borderRadius: 3, marginBottom: 2 },
  fondoVerde: { backgroundColor: 'rgba(0, 240, 255, 0.1)', borderLeftWidth: 2, borderLeftColor: '#00f0ff' }, // Pasa = Cyan brillante
  fondoRojo: { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderLeftWidth: 2, borderLeftColor: '#333' }, // No Pasa = Oscuro/Gris
  textoPilotoNombre: { color: "#e1e1e1", fontWeight: "600", letterSpacing: 0.5 },
  textoPilotoGris: { color: "#666", fontStyle: "italic", marginTop: 2, letterSpacing: 0.5 },

  // LEYENDA INFERIOR
  leyenda: { backgroundColor: "rgba(0,0,0,0.8)", paddingVertical: 10, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", flexDirection: 'row', alignItems: 'center', gap: 10 },
  leyendaTitulo: { color: '#8b48ba', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  reglasContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoReglaCompacta: { color: '#aaa', fontSize: 10, letterSpacing: 0.5 },
  separador: { width: 1, height: 12, backgroundColor: '#333', marginHorizontal: 2 },
  posDestacada: { fontWeight: '900', color: '#e1e1e1', fontSize: 10 },
  faseA: { color: '#8b48ba', fontWeight: 'bold', fontSize: 10 },
  faseB: { color: '#8b48ba', fontWeight: 'bold', fontSize: 10 },
  faseFinalB: { color: '#00f0ff', fontWeight: 'bold', fontSize: 10 },
  faseFinal: { color: '#ffd700', fontWeight: 'bold', fontSize: 10 }
});