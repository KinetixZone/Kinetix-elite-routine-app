
import { Exercise } from '../types/kinetix';

// BASE DE DATOS MAESTRA (SEED)
// Esta lista se carga automáticamente en el Storage la primera vez.
export const EXERCISES_DB: Exercise[] = [
  // --- PECHO ---
  { id: 'ch-1', name: 'Press Horizontal', muscleGroup: 'Pecho', videoUrl: 'https://www.youtube.com/embed/g80G_jaAxvs', technique: 'Retracción escapular, pies firmes.', commonErrors: [] },
  { id: 'ch-2', name: 'Press Inclinado', muscleGroup: 'Pecho', videoUrl: 'https://www.youtube.com/embed/TNmeGZp9ols', technique: 'Banco a 45 grados.', commonErrors: [] },
  { id: 'ch-3', name: 'Peck Fly', muscleGroup: 'Pecho', videoUrl: 'https://www.youtube.com/embed/xzdkyCWS2f8', technique: 'Apertura controlada.', commonErrors: [] },
  { id: 'ch-4', name: 'Lagartijas (Push-ups)', muscleGroup: 'Pecho', videoUrl: 'https://www.youtube.com/embed/SKX9JimnGpg', technique: 'Cuerpo en plancha, pecho al suelo.', commonErrors: [] },
  { id: 'ch-5', name: 'Crossover Polea', muscleGroup: 'Pecho', videoUrl: 'https://www.youtube.com/embed/QEW6RO0O-ak', technique: 'Cruce de muñecas al frente.', commonErrors: [] },
  { id: 'ch-6', name: 'Press Declinado', muscleGroup: 'Pecho', videoUrl: 'https://www.youtube.com/embed/yvp6aGRMQoA', technique: 'Enfocado en fibras inferiores.', commonErrors: [] },

  // --- PIERNAS (CUADRICEPS/FEMORAL) ---
  { id: 'leg-1', name: 'Sentadilla (Squat)', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/oSx178WQB70', technique: 'Romper el paralelo.', commonErrors: [] },
  { id: 'leg-2', name: 'Leg Extension', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/4ZDm5EbiFl8', technique: 'Extensión completa de rodilla.', commonErrors: [] },
  { id: 'leg-3', name: 'Sentadilla Búlgara', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/ODjwwOitOo0', technique: 'Torso inclinado para glúteo.', commonErrors: [] },
  { id: 'leg-4', name: 'Hack Inclinada', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/_K5qW_sENbg', technique: 'Espalda pegada al respaldo.', commonErrors: [] },
  { id: 'leg-5', name: 'Goblet Squat', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/yTDROg8zZsU', technique: 'Mancuerna al pecho.', commonErrors: [] },
  { id: 'leg-6', name: 'Prensa', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/CZrG20G5B1g', technique: 'No bloquear rodillas.', commonErrors: [] },
  { id: 'leg-7', name: 'Peso Muerto Rumano', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/9z6AYqXkBbY', technique: 'Cadera hacia atrás, tibias verticales.', commonErrors: [] },
  { id: 'leg-8', name: 'Curl Femoral Acostado', muscleGroup: 'Piernas', videoUrl: 'https://www.youtube.com/embed/Tz1XM1y1aEQ', technique: 'Talones al glúteo.', commonErrors: [] },

  // --- ESPALDA ---
  { id: 'bk-1', name: 'Remo Supino', muscleGroup: 'Espalda', videoUrl: 'https://www.youtube.com/embed/ZFkJocVACns', technique: 'Barra a la cadera.', commonErrors: [] },
  { id: 'bk-2', name: 'Jalón Abierto', muscleGroup: 'Espalda', videoUrl: 'https://www.youtube.com/embed/RD4194XvKsU', technique: 'Barra al pecho superior.', commonErrors: [] },
  { id: 'bk-3', name: 'Dominadas', muscleGroup: 'Espalda', videoUrl: 'https://www.youtube.com/embed/9S2yWQVeQJ8', technique: 'Rango completo.', commonErrors: [] },
  { id: 'bk-4', name: 'Remo T', muscleGroup: 'Espalda', videoUrl: 'https://www.youtube.com/embed/iusvKOl99qw', technique: 'Espalda neutra.', commonErrors: [] },
  { id: 'bk-5', name: 'Remo Unilateral', muscleGroup: 'Espalda', videoUrl: 'https://www.youtube.com/embed/N_KrUuUsg9k', technique: 'Apoyo firme en banco.', commonErrors: [] },
  { id: 'bk-6', name: 'Pull Over', muscleGroup: 'Espalda', videoUrl: 'https://www.youtube.com/embed/QNCHZFa1zU8', technique: 'Brazos semirrígidos.', commonErrors: [] },

  // --- BRAZOS (BICEPS/TRICEPS) ---
  { id: 'arm-1', name: 'Curl Predicador', muscleGroup: 'Bíceps', videoUrl: 'https://www.youtube.com/embed/ShWdDYFfgol', technique: 'Axilas en el banco.', commonErrors: [] },
  { id: 'arm-2', name: 'Extensión Cuerda', muscleGroup: 'Tríceps', videoUrl: 'https://www.youtube.com/embed/JVc1KAB_HLY', technique: 'Abrir cuerda al final.', commonErrors: [] },
  { id: 'arm-3', name: 'Curl Martillo', muscleGroup: 'Bíceps', videoUrl: 'https://www.youtube.com/embed/1pTUHKXGaSs', technique: 'Agarre neutro.', commonErrors: [] },
  { id: 'arm-4', name: 'Fondos (Dips)', muscleGroup: 'Tríceps', videoUrl: 'https://www.youtube.com/embed/GOPjlaRVxcU', technique: 'Codos hacia atrás.', commonErrors: [] },
  { id: 'arm-5', name: 'Press Francés', muscleGroup: 'Tríceps', videoUrl: 'https://www.youtube.com/embed/tU8nos4EoDQ', technique: 'Barra a la frente.', commonErrors: [] },

  // --- HOMBRO ---
  { id: 'sh-1', name: 'Press Militar', muscleGroup: 'Hombro', videoUrl: 'https://www.youtube.com/embed/0ph4dQ4GOI4', technique: 'Barra sobre la cabeza.', commonErrors: [] },
  { id: 'sh-2', name: 'Elevación Lateral', muscleGroup: 'Hombro', videoUrl: 'https://www.youtube.com/embed/vwfaFckD1JI', technique: 'Codos lideran el movimiento.', commonErrors: [] },
  { id: 'sh-3', name: 'Face Pull', muscleGroup: 'Hombro', videoUrl: 'https://www.youtube.com/embed/Lz9rWJfGaQA', technique: 'Cuerda a la frente.', commonErrors: [] },
  { id: 'sh-4', name: 'Arnold Press', muscleGroup: 'Hombro', videoUrl: 'https://www.youtube.com/embed/llERM60yGZc', technique: 'Rotación controlada.', commonErrors: [] },

  // --- GLÚTEO ---
  { id: 'gl-1', name: 'Hip Thrust', muscleGroup: 'Glúteo', videoUrl: 'https://www.youtube.com/embed/OK-PC9PVQWQ', technique: 'Extensión completa de cadera.', commonErrors: [] },
  { id: 'gl-2', name: 'Patada Polea', muscleGroup: 'Glúteo', videoUrl: 'https://www.youtube.com/embed/mbW5uKoLrRo', technique: 'Pierna estirada.', commonErrors: [] },
  { id: 'gl-3', name: 'Frog Pumps', muscleGroup: 'Glúteo', videoUrl: 'https://www.youtube.com/embed/87Oe9QuSn0c', technique: 'Plantas de pies juntas.', commonErrors: [] },

  // --- FUNCIONAL / HIIT ---
  { id: 'fun-1', name: 'Battle Rope Slams', muscleGroup: 'Funcional', videoUrl: 'https://www.youtube.com/embed/0cT1WmDBk2w', technique: 'Ondulación máxima.', commonErrors: [] },
  { id: 'fun-2', name: 'Burpees', muscleGroup: 'Funcional', videoUrl: 'https://www.youtube.com/embed/EkK3oVBA__Q', technique: 'Pecho al suelo y salto.', commonErrors: [] },
  { id: 'fun-3', name: 'Jumping Jacks', muscleGroup: 'Funcional', videoUrl: 'https://www.youtube.com/embed/Omk6XKk-BZg', technique: 'Coordinación manos-pies.', commonErrors: [] },
  { id: 'fun-4', name: 'Escaladores (Mountain Climbers)', muscleGroup: 'Funcional', videoUrl: 'https://www.youtube.com/embed/V0UoH5TG6fo', technique: 'Rodillas al pecho rápido.', commonErrors: [] },

  // --- HALTEROFILIA ---
  { id: 'hal-1', name: 'Clean & Jerk', muscleGroup: 'Halterofilia', videoUrl: 'https://www.youtube.com/embed/J2YH8S6-Pss', technique: 'Potencia explosiva.', commonErrors: [] },
  { id: 'hal-2', name: 'Snatch', muscleGroup: 'Halterofilia', videoUrl: 'https://www.youtube.com/embed/Ms2RPgtPxl0', technique: 'Arrancada fluida.', commonErrors: [] },
  { id: 'hal-3', name: 'Thruster', muscleGroup: 'Halterofilia', videoUrl: 'https://www.youtube.com/embed/5p7xFs_Hld4', technique: 'Sentadilla a press.', commonErrors: [] },

  // --- ABDOMEN ---
  { id: 'abs-1', name: 'Crunch', muscleGroup: 'Abdomen', videoUrl: 'https://www.youtube.com/embed/9VopAXZSZDA', technique: 'Contracción corta.', commonErrors: [] },
  { id: 'abs-2', name: 'V-Ups', muscleGroup: 'Abdomen', videoUrl: 'https://www.youtube.com/embed/iP2fjvG0g3w', technique: 'Tocar puntas de pies.', commonErrors: [] },
  { id: 'abs-3', name: 'Giro Ruso', muscleGroup: 'Abdomen', videoUrl: 'https://www.youtube.com/embed/CqvohZl3rFo', technique: 'Rotación de torso.', commonErrors: [] },
];
