import { Timestamp } from "firebase/firestore";

// ===== JUGADORES =====
export interface Jugador {
  id?: string;
  nombre: string;
  correo: string;
  dni: string;
  estado_torneo: EstadoJugador;
  fecha_registro: Date | Timestamp;
}

export type EstadoJugador =
  | "inscrito" // Recién registrado, listo para las clasificatorias
  | "clasificado_semi_a" // Quedó 1º en clasificatoria
  | "clasificado_semi_b" // Quedó 2º en clasificatoria
  | "clasificado_final_b" // Top 4 de la Semi B
  | "finalista" // Top 3 de Semi A + Top 2 de Final B
  | "eliminado" // Quedó fuera en cualquier fase
  | "ganador"; // El campeón absoluto

// ===== CARRERAS =====
export interface Carrera {
  id?: string;
  nombre_carrera: string;
  fase: FaseCarrera;
  numero: number;
  estado: EstadoCarrera;
  hora?: string;
  participantes: Participante[];
}

export type FaseCarrera =
  | "clasificatoria" // 16 carreras x 8 = 128 jugadores
  | "semifinal_a" // 2 carreras x 8 = 16 jugadores (1º de clasificatorias)
  | "semifinal_b" // 2 carreras x 8 = 16 jugadores (2º de clasificatorias)
  | "final_b" // 1 carrera x 8 (top 4 de cada semi B) → 2 clasifican
  | "final"; // 1 carrera x 8 (6 de Semi A + 2 de Final B)

export type EstadoCarrera = "pendiente" | "en_curso" | "finalizada";

export interface Participante {
  jugador_id: string;
  nombre: string;
  posicion: number; // 0 = no ha corrido, 1-8 = su posición final
}

// ===== CONFIGURACIÓN =====
export interface ConfiguracionTorneo {
  fase_actual: FaseTorneo;
  carreras_generadas: boolean;
  carrera_en_curso: string | null;
}

export type FaseTorneo =
  | "inscripcion"
  | "clasificatorias"
  | "semifinales_a"
  | "semifinales_b"
  | "final_b"
  | "final";
