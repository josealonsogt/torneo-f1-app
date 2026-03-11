import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🧠 CEREBRO DEL TORNEO
import { TorneoConfig } from "../../config/torneoConfig";
import { db } from "../../services/firebaseConfig";
import { Carrera } from "../../types/entities";

type CarreraOHueco = (Carrera & { id: string }) | { id: string; nombre_carrera: string; vacio: boolean };

export default function PantallaGrandeDesktopScreen() {
  const navigation = useNavigation();
  const [carreras, setCarreras] = useState<(Carrera & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const [zoom, setZoom] = useState(1); // Zoom normal para desktop

  // 🚫 ELIMINA LA BARRA BLANCA SUPERIOR
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
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
      <LinearGradient colors={TorneoConfig.colores.fondoGradiente as any} style={styles.center}>
        <ActivityIndicator size="large" color={TorneoConfig.colores.primario} />
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

    return [
      styles.filaPiloto, 
      pasa ? { 
        backgroundColor: `${TorneoConfig.colores.acento}1A`, 
        borderLeftWidth: 3, 
        borderLeftColor: TorneoConfig.colores.acento 
      } : styles.fondoRojo 
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
    let colorBorde = esGranFinal ? "#ffd700" : "rgba(255, 255, 255, 0.1)";
    if (carrera.estado === "en_curso") colorBorde = TorneoConfig.colores.secundario;
    
    return (
      <View style={[styles.tarjetaCristal, { borderColor: colorBorde, padding: paddingTarjeta, width: esCompacta ? '48%' : '100%' }]}>
        <View style={styles.cabeceraTarjeta}>
          <Text style={[styles.nombreCarrera, { color: esGranFinal ? '#ffd700' : TorneoConfig.colores.acento, fontSize: sizeTitulo }]} numberOfLines={1}>
            {carrera.nombre_carrera.toUpperCase()}
          </Text>
          {carrera.estado === "en_curso" && (
            <View style={[styles.badgeLive, { borderColor: TorneoConfig.colores.secundario, backgroundColor: `${TorneoConfig.colores.secundario}33` }]}>
              <View style={styles.puntoRojo}/>
              <Text style={[styles.estadoEnCurso, { color: TorneoConfig.colores.secundario }]}>LIVE</Text>
            </View>
          )}
        </View>
        
        {carrera.estado === "finalizada" ? (
          <View style={styles.listaPilotos}>
            {carrera.participantes
              .filter(p => p.posicion >= 1 && p.posicion <= 8)
              .sort((a, b) => a.posicion - b.posicion)
              .map(p => {
                let colorOro = p.posicion === 1 && esGranFinal ? '#ffd700' : '#fff';
                return(
                <View key={p.jugador_id} style={[...getEstiloPiloto(carrera.fase, p.posicion), { paddingVertical: esCompacta ? 4 : (esGranFinal ? 8 : 6) }]}>
                  <Text style={[styles.textoPilotoNombre, { fontSize: sizePiloto }]} numberOfLines={1}>
                    <Text style={{fontWeight: '900', color: colorOro}}>P{p.posicion}</Text>  {p.nombre.toUpperCase()}
                  </Text>
                </View>
              )})}
          </View>
        ) : (
          <Text style={[styles.textoPilotoGris, { fontSize: sizePiloto }]}>
            <Ionicons name="time-outline" size={sizePiloto} color={TorneoConfig.colores.primario}/> {carrera.hora ? carrera.hora : "No definida"}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#050814', '#170c2b', '#1a0524']} 
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}}>
        
        {/* HEADER CON CONTROLES DE ZOOM */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#e1e1e1" />
            <Text style={styles.textoBotonVolver}>ADMIN</Text>
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image source={require('../../assets/Logo Kaizo Sim blanco.png')} style={styles.logoPequeño} resizeMode="contain"/>
            <Text style={[styles.ayudaZoom, { color: TorneoConfig.colores.primario }]}>ZOOM: {Math.round(zoom * 100)}%</Text>
          </View>
          
          <View style={styles.controlesZoom}>
            <TouchableOpacity style={[styles.botonZoom, zoom >= 2 && styles.botonZoomDesactivado]} onPress={aumentarZoom} disabled={zoom >= 2}>
              <Ionicons name="add" size={24} color={zoom >= 2 ? "#555" : "#e1e1e1"} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.botonZoom100, { backgroundColor: `${TorneoConfig.colores.primario}66`, borderColor: TorneoConfig.colores.primario }]} onPress={resetearZoom}>
              <Text style={styles.textoResetZoom}>100%</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.botonZoom, zoom <= 0.5 && styles.botonZoomDesactivado]} onPress={reducirZoom} disabled={zoom <= 0.5}>
              <Ionicons name="remove" size={24} color={zoom <= 0.5 ? "#555" : "#e1e1e1"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🗺️ ZONA DEL BRACKET */}
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
                <Text style={[styles.tituloColumna, {color: TorneoConfig.colores.primario}]}>SEMIFINALES A</Text>
                {generarHuecos("semifinal_a", 2, "Semi A").map(c => <RenderTarjeta key={c.id} item={c} />)}
              </View>
              <View style={styles.mitadInferior}>
                <Text style={[styles.tituloColumna, {color: TorneoConfig.colores.primario}]}>SEMIFINALES B</Text>
                {generarHuecos("semifinal_b", 2, "Semi B").map(c => <RenderTarjeta key={c.id} item={c} />)}
              </View>
            </View>

            <View style={styles.columnaFinalB}>
              <View style={{ flex: 1 }} /> 
              <View style={styles.mitadInferior}>
                <Text style={[styles.tituloColumna, {color: TorneoConfig.colores.acento}]}>REPESCA (FINAL B)</Text>
                {generarHuecos("final_b", 1, "").map(c => <RenderTarjeta key={c.id} item={c} />)}
              </View>
            </View>

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
          <Text style={[styles.leyendaTitulo, { color: TorneoConfig.colores.primario }]}>REGLAMENTO DE PROGRESIÓN:</Text>
          <View style={styles.reglasContainer}>
            <View style={styles.reglaItem}>
              <View style={[styles.badge, {backgroundColor: TorneoConfig.colores.primario}]}><Text style={styles.badgeTexto}>P1</Text></View>
              <Text style={styles.textoRegla}>Clasificatorias → Semifinal A</Text>
            </View>
            <View style={styles.reglaItem}>
              <View style={[styles.badge, {backgroundColor: TorneoConfig.colores.primario}]}><Text style={styles.badgeTexto}>P2</Text></View>
              <Text style={styles.textoRegla}>Clasificatorias → Semifinal B</Text>
            </View>
            <View style={styles.reglaItem}>
              <View style={[styles.badge, {backgroundColor: '#ffd700'}]}><Text style={[styles.badgeTexto, {color: '#000'}]}>TOP 3</Text></View>
              <Text style={styles.textoRegla}>Semifinal A → Gran Final</Text>
            </View>
            <View style={styles.reglaItem}>
              <View style={[styles.badge, {backgroundColor: TorneoConfig.colores.acento}]}><Text style={[styles.badgeTexto, {color: '#000'}]}>TOP 4</Text></View>
              <Text style={styles.textoRegla}>Semifinal B → Final B</Text>
            </View>
            <View style={styles.reglaItem}>
              <View style={[styles.badge, {backgroundColor: '#ffd700'}]}><Text style={[styles.badgeTexto, {color: '#000'}]}>TOP 2</Text></View>
              <Text style={styles.textoRegla}>Final B → Gran Final</Text>
            </View>
          </View>
        </View>
        
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoCargando: { color: "#fff", marginTop: 15, fontWeight: "900", letterSpacing: 2, fontSize: 14 },
  
  header: { 
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', 
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, 
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", 
    alignItems: "center", justifyContent: "space-between" 
  },
  botonVolver: { flexDirection: 'row', alignItems: 'center', width: 100 },
  textoBotonVolver: { color: "#e1e1e1", fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
  logoPequeño: { width: 150, height: 40 },
  ayudaZoom: { fontSize: 12, marginTop: 4, letterSpacing: 1, fontWeight: 'bold' },
  
  controlesZoom: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  botonZoom: { 
    width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, 
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'
  },
  botonZoom100: { paddingHorizontal: 12, height: 44, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  botonZoomDesactivado: { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'transparent' },
  textoResetZoom: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  
  board: { flexDirection: "row", padding: 25, flexGrow: 1 },
  columnaAncha: { width: 440, marginRight: 30 }, 
  columnaMedia: { width: 280, marginRight: 30 },
  columnaFinalB: { width: 280, marginRight: 30 }, 
  columnaGigante: { width: 340, marginRight: 20 }, 
  gridClasificatorias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mitadSuperior: { flex: 1, justifyContent: 'center' },
  mitadInferior: { flex: 1, justifyContent: 'center', marginTop: 20 },
  
  tituloColumna: { color: "#e1e1e1", fontSize: 13, fontWeight: "900", textAlign: "center", marginBottom: 15, letterSpacing: 2 },
  
  tarjetaCristal: { 
    backgroundColor: 'rgba(12, 12, 15, 0.8)', borderRadius: 8, marginBottom: 12, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5, elevation: 5
  },
  tarjetaVacia: { 
    backgroundColor: "transparent", borderRadius: 8, marginBottom: 12, 
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: 'dashed', 
    alignItems: 'center', justifyContent: 'center' 
  },
  cabeceraTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  nombreCarrera: { fontWeight: "900", flex: 1, letterSpacing: 1 },
  nombreCarreraVacia: { color: "#555", fontWeight: "900", marginBottom: 5, letterSpacing: 1 },
  
  badgeLive: { flexDirection: 'row', alignItems: 'center', gap:4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  puntoRojo: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  estadoEnCurso: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  
  listaPilotos: { marginTop: 0 },
  filaPiloto: { paddingHorizontal: 10, borderRadius: 4, marginBottom: 3 },
  fondoRojo: { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderLeftWidth: 3, borderLeftColor: '#333' }, 
  textoPilotoNombre: { color: "#e1e1e1", fontWeight: "600", letterSpacing: 0.5 },
  
  textoPilotoGris: { color: "#666", fontStyle: "italic", marginTop: 3, letterSpacing: 1 },

  leyenda: { backgroundColor: "rgba(0,0,0,0.8)", paddingVertical: 20, paddingHorizontal: 30, borderTopWidth: 2, borderTopColor: "rgba(255,255,255,0.05)" },
  leyendaTitulo: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 15, textAlign: 'center' },
  reglasContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 20 },
  reglaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, minWidth: 50, alignItems: 'center' },
  badgeTexto: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  textoRegla: { color: '#ccc', fontSize: 13, letterSpacing: 0.5 }
});