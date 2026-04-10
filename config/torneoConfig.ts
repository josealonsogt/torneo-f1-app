// config/torneoConfig.ts

export const TorneoConfig = {
  // 📝 1. TEXTOS Y DATOS DEL TORNEO
  nombreLargo: "MATSURI RACING",
  subtitulo: "TORNEO OFICIAL",
  whatsappGrupo: "https://chat.whatsapp.com/E6N92rpfsbZG6yoLkwwjPu?mode=gi_",
  // ⚙️ 2. REGLAS DE CARRERA (¡Se acabó buscar el número 8 por el código!)
  maxParticipantesPorCarrera: 8,
  carrerasPorBloque: 4, // Agrupa de 4 en 4 para llenar primero esas 32 plazas

  // 🎨 3. PINTURA DE LA ESCUDERÍA (Colores)
  colores: {
    primario: "#8b48ba",       // Morado Kaizō (Botones, bordes)
    primarioOscuro: "#4a2564", // Para el degradado del botón
    secundario: "#e63946",     // Rojo (Avisos, DNF)
    acento: "#00f0ff",         // Cyan
    
    // Degradado del fondo de la app
    fondoGradiente: ['#050814', '#170c2b', '#481f5c', '#8a1d34'],
  }
};