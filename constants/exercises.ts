import { Exercise } from '../types/kinetix';

// BASE DE DATOS MAESTRA DE EJERCICIOS KINETIX (CON VIDEOS DE DEMOSTRACIÓN TÉCNICA Y SHORT DE YOUTUBE)
// Contiene todos los ejercicios del catálogo oficial Kinetix Functional Zone & Athlete Hub
export const EXERCISES_DB: Exercise[] = [
  // ==========================================
  // --- PECHO (PECTORALES) ---
  // ==========================================
  { 
    id: 'ch-01', 
    name: 'Press Horizontal (Banca Plana)', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtu.be/g8oG_jaAxvs?si=ymgMP-_XlUqbZ3TH', 
    technique: 'Retracción y depresión escapular. Pies plantados firmes en el suelo, codos a ~45°-70° respecto al torso. Barra desciende al esternón medio.', 
    commonErrors: ['Despegar glúteos del banco', 'Abrir codos a 90° estresando manguito rotador', 'Rebotar la barra en el pecho'] 
  },
  { 
    id: 'ch-02', 
    name: 'Press Inclinado', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/TNmeGZp9ols?si=k1mafvxCM_8ff2K3', 
    technique: 'Banco a 30°-45°. Mayor activación en haz clavicular. Controlar fase excéntrica y empujar perpendicular al torso.', 
    commonErrors: ['Excesiva inclinación (>45°) convirtiéndolo en press de hombro', 'Hiperextensión lumbar'] 
  },
  { 
    id: 'ch-03', 
    name: 'Peck Fly (Aperturas en Contractor)', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/xzdkyCWS2f8?si=gehQjzT6jbuoWP38', 
    technique: 'Codos ligeramente flexionados fijos. Conducir con los codos hacia el centro para máxima aducción horizontal.', 
    commonErrors: ['Flexionar y extender codos como press', 'Sobrestirar articulación glenohumeral en fase excéntrica'] 
  },
  { 
    id: 'ch-04', 
    name: 'Press Sentado en Máquina', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/JXJmPXlqwh0?si=oNTpPEKVOY70JIga', 
    technique: 'Alinear manerales con la línea media del pectoral. Mantener escápulas pegadas al respaldo en todo el rango.', 
    commonErrors: ['Protracción de hombros al final del empuje', 'Perder tensión en el cambio de dirección'] 
  },
  { 
    id: 'ch-05', 
    name: 'Lagartijas (Push-ups)', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/SKX9JimnGpg?si=9RoUL8CQrt4SOX6h', 
    technique: 'Plancha activa: glúteos y core firmes. El pecho roza el suelo, codos en punta de flecha (45°).', 
    commonErrors: ['Dejar caer la cadera (hiperextensión lumbar)', 'Aletear codos hacia los lados', 'Rango incompleto'] 
  },
  { 
    id: 'ch-06', 
    name: 'Crossover (Cruce en Poleas)', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/QEW6RO0O-ak?si=TscKmpKwbfMD6qVk', 
    technique: 'Torso ligeramente inclinado. Cruzar las manos al frente buscando contracción pico de 1 segundo.', 
    commonErrors: ['Usar inercia balanceando el torso', 'Exceso de carga que deforma la trayectoria del codo'] 
  },
  { 
    id: 'ch-07', 
    name: 'Flow Press (Floor Press)', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/JE8fSUgLebY?si=7kJL14kZ0EW1cyPR', 
    technique: 'Tumbado en el suelo, tríceps tocan suavemente el suelo eliminando ciclo estiramiento-acortamiento antes de empujar.', 
    commonErrors: ['Golpear codos contra el piso', 'Perder tensión en el abdomen'] 
  },
  { 
    id: 'ch-08', 
    name: 'Peck Deck (Contractor Pectoral)', 
    muscleGroup: 'Pecho', 
    videoUrl: 'https://youtube.com/shorts/GdoRBGpGkYA?si=sab2rofmF3TU7dIg', 
    technique: 'Espalda bien apoyada. Apretar pectorales en el centro manteniendo el pecho alto y cuello relajado.', 
    commonErrors: ['Adelantar la cabeza', 'No controlar el retorno de las almohadillas'] 
  },
  {
    id: 'ch-09',
    name: 'Fondos en Paralelas (Pecho / Dips)',
    muscleGroup: 'Pecho',
    videoUrl: 'https://youtube.com/shorts/GOPjlaRVxcU?si=ew1gaKPRpvLgFvgE',
    technique: 'Torso inclinado 30° hacia adelante, codos ligeramente abiertos para reclutar pectoral inferior.',
    commonErrors: ['Mantenerse totalmente vertical (carga el tríceps)', 'Descender excesivamente estresando el hombro']
  },

  // ==========================================
  // --- CUÁDRICEPS & CADENA ANTERIOR PIERNAS ---
  // ==========================================
  { 
    id: 'qd-01', 
    name: 'Sentadilla Trasera (Back Squat)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/oSxJ78WQBZ0?si=GQP3M0V-w-LFXlXZ', 
    technique: 'Pies ancho de hombros, puntas ligeramente abiertas. Romper el paralelo con rodillas alineadas a las puntas y torso neutro.', 
    commonErrors: ['Valgo de rodilla (rodillas colapsan hacia adentro)', 'Despegar talones del suelo', 'Butt wink excesivo'] 
  },
  { 
    id: 'qd-02', 
    name: 'Sentadilla Hack Inclinada', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/_K5qW_sENbg?si=RBo1iV9-3kVdQIIO', 
    technique: 'Espalda totalmente acoplada al respaldo. Profundidad controlada enfocando máxima flexión de rodilla.', 
    commonErrors: ['Despegar zona lumbar del cojín', 'Bloquear violentamente rodillas arriba'] 
  },
  { 
    id: 'qd-03', 
    name: 'Leg Extensión (Extensión de Cuádriceps)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtu.be/4ZDm5EbiFI8?si=CO1NoZnVXiTjsoo0', 
    technique: 'Eje de la máquina alineado con la rodilla. Extensión completa con pausa isométrica de 1 segundo arriba.', 
    commonErrors: ['Lanzar el peso con impulso de caderas', 'No controlar la bajada excéntrica'] 
  },
  { 
    id: 'qd-04', 
    name: 'Abductores en Máquina', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/HkT-b8oVoF4?si=5VZOnSnAqBpLa2m_', 
    technique: 'Sentado firme, empujar hacia afuera desde las almohadillas sintiendo glúteo medio y tensor de fascia lata.', 
    commonErrors: ['Usar inercia rápida en vez de control', 'Rango de apertura corto'] 
  },
  { 
    id: 'qd-05', 
    name: 'Goblet Squat (Sentadilla Copa)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/yTDROg8zZsU?si=rcvKpx7tNuH2LrjC', 
    technique: 'Mancuerna o kettlebell pegada al pecho vertical. Codos apuntan hacia abajo, torso muy erguido al descender.', 
    commonErrors: ['Separar la mancuerna del esternón', 'Perder la verticalidad del tronco'] 
  },
  { 
    id: 'qd-06', 
    name: 'Low Squat (Sentadilla Profunda / Barra Baja)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/O6kbqhP_tVE?si=0arF8SGdF4aj4gCm', 
    technique: 'Barra posicionada sobre deltoides posterior. Mayor flexión de cadera y activación de toda la cadena posterior.', 
    commonErrors: ['Convertir la sentadilla en un buenos días', 'Mirar hacia el techo forzando cervicales'] 
  },
  { 
    id: 'qd-07', 
    name: 'Front Squats (Sentadilla Frontal)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtu.be/Q1Ypb8ZNzI4?si=cL7135el1GIvX3_j', 
    technique: 'Barra apoyada sobre deltoides anteriores con codos altos horizontales. Torso ultra vertical.', 
    commonErrors: ['Dejar caer los codos (la barra resbala)', 'Inclinarse hacia adelante'] 
  },
  { 
    id: 'qd-08', 
    name: 'Heels Squats (Sentadilla con Talones Elevados)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/79E_U4zY7gI?si=16HC9STsZRzNKJwb', 
    technique: 'Talones sobre cuña o discos de 2-4 cm. Maximiza recorrido anterior de rodilla y foco en vasto medial/lateral.', 
    commonErrors: ['Perder el equilibrio', 'Rebotar bruscamente en el fondo'] 
  },
  { 
    id: 'qd-09', 
    name: 'Step Up (Subidas al Cajón)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/mw6iqu9K8DY?si=K_Xu-3xVsB0seUBL', 
    technique: 'Pie de apoyo firme en el cajón. Impulsarse exclusivamente con la pierna alta, sin saltar con la pierna de abajo.', 
    commonErrors: ['Empujar fuertemente con la pantorrilla del pie inferior', 'Poco control en el descenso'] 
  },
  { 
    id: 'qd-10', 
    name: 'Prensa de Piernas (Leg Press)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/CZrG20G5B1g?si=jalpioPkL_AtWHso', 
    technique: 'Pies en el centro de la plataforma a ancho de hombros. Bajar hasta 90° sin despegar el sacro del asiento.', 
    commonErrors: ['Hiperextensión o bloqueo brusco de rodillas', 'Despegar la pelvis de la almohadilla'] 
  },

  // ==========================================
  // --- ESPALDA & DORSALES ---
  // ==========================================
  { 
    id: 'bk-01', 
    name: 'Remo Supino con Barra', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/ZFkJocVACns?si=bukuYi7OtmPPDCTj', 
    technique: 'Agarre palmas hacia arriba a ancho de hombros. Torso a 45°. Traccionar barra hacia el ombligo pegando codos al cuerpo.', 
    commonErrors: ['Levantar el torso por exceso de peso', 'Tironear con los bíceps en lugar de conducir con los codos'] 
  },
  { 
    id: 'bk-02', 
    name: 'Remo Prono con Barra', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtu.be/sOij1orUmbk?si=a1sXZqJvoPqK-FhG', 
    technique: 'Agarre palmas hacia abajo algo más ancho. Barra tracciona al esternón inferior enfatizando dorsal medio y deltoides posterior.', 
    commonErrors: ['Redondear espalda baja', 'Encoger los hombros hacia las orejas'] 
  },
  { 
    id: 'bk-03', 
    name: 'Remo T (Barra T / T-Bar Row)', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/iusvKOl99qw?si=kRIl1It2_DMTyuNF', 
    technique: 'Pecho apoyado o torso bloqueado a 45°. Tracción potente juntando escápulas en la contracción.', 
    commonErrors: ['Impulso lumbar agresivo', 'No completar la fase concéntrica'] 
  },
  { 
    id: 'bk-04', 
    name: 'Jalón Abierto al Pecho (Lat Pulldown)', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/RD4t94XvKsU?si=vl4V4ns1X8wDWi7J', 
    technique: 'Barra ancha, inclinación de 10°-15°. Traccionar los codos hacia abajo y atrás llevando la barra a la clavícula.', 
    commonErrors: ['Jalar trasnuca (riesgo cervical)', 'Inclinarse 45° atrás convirtiéndolo en un remo'] 
  },
  { 
    id: 'bk-05', 
    name: 'Jalón Cerrado / Agarre Neutro', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/Ks3yr_wl8WU?si=eilaLUFNwpvUh5w7', 
    technique: 'Maneral triangular o neutro. Mayor rango de recorrido para las fibras inferiores del dorsal ancho.', 
    commonErrors: ['Balanceo del tronco', 'No estirar completamente el dorsal en la subida'] 
  },
  { 
    id: 'bk-06', 
    name: 'Remo en Máquina (Seated Cable Row)', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/4o8scFhoDdE?si=BBoPiM9wKL8nvP1C', 
    technique: 'Pecho erguido, pies firmes en los topes. Estirar escápulas en la fase negativa y retraerlas potentemente al traccionar.', 
    commonErrors: ['Balancearse hacia adelante y atrás como remador de canoa'] 
  },
  { 
    id: 'bk-07', 
    name: 'Remo Inclinado con Mancuernas en Banco', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/9u5yLR9zmAs?si=DZHKyWnvSvKuHn9b', 
    technique: 'Pecho descansando sobre banco inclinado a 30°-45°. Aísla completamente la musculatura dorsal sin fatiga lumbar.', 
    commonErrors: ['Despegar el pecho del banco', 'Impulsar con la cabeza'] 
  },
  { 
    id: 'bk-08', 
    name: 'Pull Over en Polea Alta', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtube.com/shorts/QNCHZFa1zU8?si=QOvnvJc1Bjpjfr3h', 
    technique: 'Brazos semirrígidos con ligera flexión fija de codos. Describir un arco desde los ojos hasta los muslos.', 
    commonErrors: ['Flexionar y extender los codos (usando tríceps en lugar de dorsal)', 'Dejar que el torso se levante'] 
  },
  { 
    id: 'bk-09', 
    name: 'Jalón Cruzado en Polea (Unilateral)', 
    muscleGroup: 'Espalda', 
    videoUrl: 'https://youtu.be/G7vnN9SuW4c?si=xalIXxvFQIdOi0st', 
    technique: 'Arrodillado o sentado lateral. Traccionar en el plano de la fibra muscular para máximo aislamiento escapular.', 
    commonErrors: ['Rotar el torso desalineando el hombro'] 
  },

  // ==========================================
  // --- ISQUIOTIBIALES (FEMORALES) ---
  // ==========================================
  { 
    id: 'hm-01', 
    name: 'Peso Muerto Rumano (RDL)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/9z6AYqXkBbY?si=iZgw0BHjmIKFMxIu', 
    technique: 'Rodillas fijas con flexión mínima (~15°). Empujar la cadera hacia la pared trasera sintiendo tensión profunda en isquios.', 
    commonErrors: ['Flexionar rodillas como en sentadilla', 'Curvar la columna dorsal/lumbar', 'Bajar más allá de la flexibilidad de la cadera'] 
  },
  { 
    id: 'hm-02', 
    name: 'Peso Muerto Convencional', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/rzpikhhtwwA?si=jqKzOAzgZ8ultTNO', 
    technique: 'Barra sobre mitad del pie. Empujar el piso con los pies, mantener barra en contacto con las tibias en el despegue.', 
    commonErrors: ['Subir la cadera antes que los hombros (tirar solo con la espalda)', 'Hiperextender la espalda al bloquear'] 
  },
  { 
    id: 'hm-03', 
    name: 'Variantes de Peso Muerto', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/5kYMN400cOs?si=OtJSPJ7bgrv5-WSz', 
    technique: 'Análisis biomecánico de stance: sumo, semizancada y rumano con mancuernas para adaptación de palancas.', 
    commonErrors: ['Perder la neutralidad pélvica', 'Mirar hacia arriba hiper-extendiendo cuello'] 
  },
  { 
    id: 'hm-04', 
    name: 'Femoral Acostado (Lying Leg Curl)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/Tz1XM1y1aEQ?si=SqK6sI-h07FMGTCG', 
    technique: 'Pelvis firmemente pegada al banco. Flexión potente llevando talones a glúteos, bajada lenta en 3 segundos.', 
    commonErrors: ['Elevar la cadera del banco para ayudarse', 'Dorsiflexión exagerada descontrolada'] 
  },
  { 
    id: 'hm-05', 
    name: 'Femoral Sentado (Seated Leg Curl)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/oc8SshREFi0?si=z0klzYNet5Tl19gM', 
    technique: 'Cojín superior bloquea firmemente muslos. La cadera flexionada a 90° coloca los isquiotibiales en estiramiento previo ideal.', 
    commonErrors: ['Ajuste flojo del cojín superior que permite movimiento de fémur'] 
  },
  { 
    id: 'hm-06', 
    name: 'Peso Muerto con Cuerda en Polea', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/cd2A4tYBLDs?si=cwQE2keI09kA79ls', 
    technique: 'Espalda a la polea baja, pasar cuerda entre piernas. Tracción con bisagra de cadera y bloqueo de glúteos.', 
    commonErrors: ['Tirar con los brazos en lugar de extender la cadera'] 
  },
  { 
    id: 'hm-07', 
    name: 'Kang Squats (Sentadilla Kang)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/3vkdME1JZEY?si=yQ31mh2ZfUFx_wtz', 
    technique: 'Movimiento híbrido: Good Morning hasta paralelo y desde allí transición a sentadilla profunda, volviendo por el mismo patrón.', 
    commonErrors: ['Cargas excesivas (ejercicio de control y movilidad neuromuscular)'] 
  },
  { 
    id: 'hm-08', 
    name: 'Curl Femoral Unilateral de Pie', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtu.be/F_SEiWLbMGY?si=_NFNUq8w7l5bUHwz', 
    technique: 'Tronco estable, rodilla apoyada contra almohadilla. Flexión de rodilla aislando cada extremidad independientemente.', 
    commonErrors: ['Rotar la cadera hacia el lado del curl'] 
  },

  // ==========================================
  // --- BÍCEPS ---
  // ==========================================
  { 
    id: 'bi-01', 
    name: 'Curl Predicador (Banco Scott)', 
    muscleGroup: 'Bíceps', 
    videoUrl: 'https://youtube.com/shorts/ShWdDYEfgoU?si=zrJCabe0t_WU9HP9', 
    technique: 'Axilas encajadas en el borde superior del banco. Brazos paralelos, no hiperextender bruscamente en el punto bajo.', 
    commonErrors: ['Despegar los codos del soporte', 'Rebotar al final del recorrido poniendo en riesgo el tendón'] 
  },
  { 
    id: 'bi-02', 
    name: 'Curl Supino con Barra / Mancuernas', 
    muscleGroup: 'Bíceps', 
    videoUrl: 'https://youtube.com/shorts/XynAms-XSqs?si=NTFvHMnnMENckYeY', 
    technique: 'Codos pegados a los costados del tórax. Supinación activa en el punto concéntrico.', 
    commonErrors: ['Balancear el torso hacia atrás para iniciar la subida', 'Adelantar los codos'] 
  },
  { 
    id: 'bi-03', 
    name: 'Curl Hércules (Doble Polea Alta)', 
    muscleGroup: 'Bíceps', 
    videoUrl: 'https://youtube.com/shorts/_x80qv0h3Xs?si=UNMdgCA92sRRFUdk', 
    technique: 'Posición de cruz con brazos a la altura de los hombros. Flexión de codos llevando los puños hacia las orejas.', 
    commonErrors: ['Bajar los codos perdiendo la línea horizontal', 'Adelantar la cabeza'] 
  },
  { 
    id: 'bi-04', 
    name: 'Curl con Cuerda en Polea Baja', 
    muscleGroup: 'Bíceps', 
    videoUrl: 'https://youtube.com/shorts/KiyMFeMg04o?si=HuVL7BUlgShAU-V3', 
    technique: 'Agarre neutro a semiprono. Separar las puntas de la cuerda arriba para involucrar braquial y bíceps braquial.', 
    commonErrors: ['Despegar codos del torso', 'Usar peso excesivo que curve la espalda'] 
  },
  { 
    id: 'bi-05', 
    name: 'Curl Martillo (Hammer Curl)', 
    muscleGroup: 'Bíceps', 
    videoUrl: 'https://youtube.com/shorts/1pTUHKXGaSs?si=QHCLnT5kNBYIQ85n', 
    technique: 'Palmas enfrentadas en agarre neutro constante. Recluta braquiorradial y braquial anterior.', 
    commonErrors: ['Girar muñecas a supinación (debe mantenerse neutro)', 'Impulso con piernas'] 
  },

  // ==========================================
  // --- TRÍCEPS ---
  // ==========================================
  { 
    id: 'tri-01', 
    name: 'Extensión de Tríceps con Cuerda', 
    muscleGroup: 'Tríceps', 
    videoUrl: 'https://youtube.com/shorts/JVc1KAB_HLY?si=8sVXyezDRUtnjVDX', 
    technique: 'Codos inmóviles pegados a las costillas. Extender completamente y abrir la cuerda hacia afuera al final.', 
    commonErrors: ['Mover los codos hacia adelante y atrás', 'Encoger los hombros'] 
  },
  { 
    id: 'tri-02', 
    name: 'Extensión de Tríceps con Triángulo / Barra V', 
    muscleGroup: 'Tríceps', 
    videoUrl: 'https://youtube.com/shorts/3Iu8DikX1Pk?si=We9Bp6RlUCaKYRbc', 
    technique: 'Permite manejar cargas superiores con agarre semiprono estable. Presionar hacia el piso bloqueando tríceps.', 
    commonErrors: ['Inclinarse sobre la barra usando peso corporal para empujar'] 
  },
  { 
    id: 'tri-03', 
    name: 'Fondos de Tríceps (Dips)', 
    muscleGroup: 'Tríceps', 
    videoUrl: 'https://youtube.com/shorts/GOPjlaRVxcU?si=ew1gaKPRpvLgFvgE', 
    technique: 'Torso erguido perpendicular al suelo, codos cerrados apuntando hacia atrás en el descenso.', 
    commonErrors: ['Inclinar el torso al frente (transfiere la carga al pecho)', 'Abrir los codos'] 
  },
  { 
    id: 'tri-04', 
    name: 'Press Francés con Barra Z', 
    muscleGroup: 'Tríceps', 
    videoUrl: 'https://youtube.com/shorts/tU8nos4EoDQ?si=nBEx7Rwaf-RKBame', 
    technique: 'Brazos inclinados ligeramente hacia atrás (~75° respecto al torso). Flexionar codos llevando barra a la coronilla.', 
    commonErrors: ['Bajar la barra a la barbilla o nariz', 'Mover hombros convirtiéndolo en pullover'] 
  },
  { 
    id: 'tri-05', 
    name: 'Press Copa (Extensión Vertical con Mancuerna)', 
    muscleGroup: 'Tríceps', 
    videoUrl: 'https://youtube.com/shorts/m4MHwioXgw0?si=wao3-OoPtjYgVnK3', 
    technique: 'Sostener mancuerna con ambas manos sobre la cabeza. Bajar por detrás de la nuca con codos cerrados.', 
    commonErrors: ['Abrir excesivamente los codos', 'Hiperextender zona lumbar'] 
  },
  { 
    id: 'tri-06', 
    name: 'Extensión Supina (Agarre Invertido en Polea)', 
    muscleGroup: 'Tríceps', 
    videoUrl: 'https://youtube.com/shorts/0Hd9taS4QEs?si=HUndqKqtw75anft3', 
    technique: 'Palmas hacia arriba en barra recta. Aislamiento enfocado en la cabeza medial del tríceps.', 
    commonErrors: ['Perder el agarre supino por carga excesiva'] 
  },

  // ==========================================
  // --- HOMBROS & DELTOIDES ---
  // ==========================================
  { 
    id: 'sh-01', 
    name: 'Press Militar de Pie (Overhead Press)', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/0ph4dQ4GOI4?si=aAqdYrWYNuY4T0Sr', 
    technique: 'Glúteos y core apretados como piedra. Barra sale de clavículas y viaja vertical rozando la nariz.', 
    commonErrors: ['Arquear la espalda baja hacia atrás', 'Empujar con impulso de piernas (sería push press)'] 
  },
  { 
    id: 'sh-02', 
    name: 'Press de Hombro en Máquina Smith', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/qVx9Sxz0PPc?si=ImGNFvI3YTTkCbcd', 
    technique: 'Banco a 75°-80°. Trayectoria fija para máxima seguridad articular y foco en deltoides anterior.', 
    commonErrors: ['Sentarse demasiado adelante arqueando la espalda'] 
  },
  { 
    id: 'sh-03', 
    name: 'Elevación Lateral con Mancuernas', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/vwfaFckD1JI?si=JP_WjrUF4SVQbZts', 
    technique: 'Codos lideran el ascenso en el plano escapular (30° adelante del plano frontal). Muñecas relajadas.', 
    commonErrors: ['Subir las manos por encima de los codos', 'Encoger los trapecios hacia las orejas', 'Usar balanceo'] 
  },
  { 
    id: 'sh-04', 
    name: 'Elevación Frontal', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/jk7YrK79ciA?si=cuyF59bt_jHrtsCb', 
    technique: 'Subir hasta la altura de los ojos con pausa concéntrica de 0.5s. Descenso en 2 segundos.', 
    commonErrors: ['Impulso pélvico hacia adelante'] 
  },
  { 
    id: 'sh-05', 
    name: 'Elevación Neutra para Deltoides', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/TUaZYRyAV1k?si=bfT6Ds4JP6smdBqB', 
    technique: 'Agarre martillo en elevación, reduciendo el pinzamiento subacromial.', 
    commonErrors: ['Exceso de peso que obliga a flexionar codos a 90°'] 
  },
  { 
    id: 'sh-06', 
    name: 'Face Pull con Cuerda en Polea', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/Lz9rWJfGaQA?si=TCPXZn2LPz49nLJP', 
    technique: 'Polea a la altura de la vista. Jalar hacia la frente separando los extremos y rotando externamente los hombros.', 
    commonErrors: ['Jalar al pecho en vez de a la frente', 'No rotar externamente los hombros'] 
  },
  { 
    id: 'sh-07', 
    name: 'Elevación Posterior (Pájaros / Rear Delt Fly)', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/nO-JNf2b3s8?si=5odeLGpzfeY4dkL_', 
    technique: 'Torso paralelo al suelo. Abrir los brazos guiando con el codo para atacar directamente el deltoides posterior.', 
    commonErrors: ['Juntar escápulas excesivamente tirando con romboides y trapecio'] 
  },
  { 
    id: 'sh-08', 
    name: 'Press Arnold con Mancuernas', 
    muscleGroup: 'Hombro', 
    videoUrl: 'https://youtube.com/shorts/llERM60yGZc?si=BDuaDwNkpsI3AfAH', 
    technique: 'Inicio con palmas mirando al rostro. Rotar externamente de manera suave mientras se realiza el press superior.', 
    commonErrors: ['Rotación descoordinada o apresurada'] 
  },

  // ==========================================
  // --- GLÚTEO ---
  // ==========================================
  { 
    id: 'gl-01', 
    name: 'Hip Thrust con Barra / Máquina', 
    muscleGroup: 'Glúteo', 
    videoUrl: 'https://youtube.com/shorts/OK-PC9PVQWQ?si=BVAi8noSR3MdYhLS', 
    technique: 'Borde inferior de escápulas sobre el banco. Mentón al pecho, empujar con los talones y bloquear glúteos en retroversión pélvica.', 
    commonErrors: ['Hiperextender la columna lumbar en vez de bascular la pelvis', 'Mirar al techo en lugar de al frente'] 
  },
  { 
    id: 'gl-02', 
    name: 'Extensión de Cadera (Hip Extension)', 
    muscleGroup: 'Glúteo', 
    videoUrl: 'https://youtube.com/shorts/K0oRgljazZc?si=GxU7WSKGpymsvoFZ', 
    technique: 'En banco a 45° con soporte bajo la cadera. Redondear ligeramente espalda alta para focalizar 100% en glúteos.', 
    commonErrors: ['Subir arqueando la zona lumbar'] 
  },
  { 
    id: 'gl-03', 
    name: 'Patada para Glúteo en Máquina / Cuatro Puntos', 
    muscleGroup: 'Glúteo', 
    videoUrl: 'https://youtu.be/h4yLoQWOxAw?si=LL7rL9MnRTm9u53V', 
    technique: 'Extender la pierna hacia atrás y ligeramente arriba apretando el glúteo mayor sin rotar la pelvis.', 
    commonErrors: ['Arquear la espalda baja para ganar altura falsa'] 
  },
  { 
    id: 'gl-04', 
    name: 'Patada de Glúteo en Polea con Grillete', 
    muscleGroup: 'Glúteo', 
    videoUrl: 'https://youtube.com/shorts/mbW5uKoLrRo?si=f-7Tw371Fn6WHgQI', 
    technique: 'Torso inclinado a 45° apoyado en la torre. Trayectoria diagonal hacia afuera respetando la dirección de las fibras.', 
    commonErrors: ['Girar la cadera abriendo la pelvis al costado'] 
  },
  { 
    id: 'gl-05', 
    name: 'Desplante Búlgaro (Bulgarian Split Squat)', 
    muscleGroup: 'Glúteo', 
    videoUrl: 'https://youtube.com/shorts/ODjwvOitOo0?si=PujSjXsS4VN2WC3m', 
    technique: 'Empeine sobre banco trasero. Torso inclinado a 20° para cargar el glúteo de la pierna delantera.', 
    commonErrors: ['Distancia de paso muy corta o muy larga', 'Colapso de rodilla hacia adentro'] 
  },
  { 
    id: 'gl-06', 
    name: 'Desplantes (Zancadas / Lunges)', 
    muscleGroup: 'Glúteo', 
    videoUrl: 'https://youtube.com/shorts/h8T5Bx0d0fk?si=EB-w3zaZV8F2Iwl9', 
    technique: 'Paso firme al frente, rodilla trasera desciende a 2 cm del suelo. Ambos ángulos en 90°.', 
    commonErrors: ['Pisar en la misma línea perdiendo el equilibrio (deben estar en rieles paralelos)'] 
  },

  // ==========================================
  // --- PANTORRILLA ---
  // ==========================================
  { 
    id: 'cal-01', 
    name: 'Costurera (Elevación de Gemelos Sentado)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/jeGHLQoKfPk?si=G7lH_NgR1CWEE3KX', 
    technique: 'Rodillas flexionadas a 90° desactivan los gastrocnemios y aíslan el músculo sóleo. Pausa profunda abajo y arriba.', 
    commonErrors: ['Rebotar en la parte inferior sobre el tendón de Aquiles'] 
  },
  { 
    id: 'cal-02', 
    name: 'Elevación de Talón de Pie', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/JhDqNv2DoAU?si=fD5fUHJpwVR2s0Pu', 
    technique: 'Rodillas bloqueadas en extensión. Subir sobre la base del dedo gordo para máxima contracción del gastrocnemio.', 
    commonErrors: ['Flexionar las rodillas durante la elevación', 'Recorrido incompleto'] 
  },

  // ==========================================
  // --- ENTRENAMIENTO FUNCIONAL & HIIT ---
  // ==========================================
  { 
    id: 'fn-01', 
    name: 'Oleajes (Battle Ropes)', 
    muscleGroup: 'Funcional', 
    videoUrl: 'https://youtube.com/shorts/2DxpsLjRwZI?si=362yY_Vy2tN5TsIz', 
    technique: 'Posición atlética de media sentadilla, core blindado. Ondulaciones de muñeca y hombro sin perder la cadencia.', 
    commonErrors: ['Erguirse perdiendo la base atlética', 'Mover solo los codos'] 
  },
  { 
    id: 'fn-02', 
    name: 'Kettlebell Swing', 
    muscleGroup: 'Funcional', 
    videoUrl: 'https://youtube.com/shorts/ROAhRv5x-Ow?si=B-2TCElUrZMsRMaN', 
    technique: 'Pura bisagra de cadera balística. La kettlebell flota por la explosión de glúteos e isquios, no por fuerza de hombros.', 
    commonErrors: ['Hacer sentadilla en vez de bisagra', 'Elevar la pesa con los brazos'] 
  },
  { 
    id: 'fn-03', 
    name: 'Shoulder Tap en Plancha', 
    muscleGroup: 'Funcional', 
    videoUrl: 'https://youtube.com/shorts/J9QSqLq4L6U?si=_g5ziS-Mc0CXFfzJ', 
    technique: 'Plancha alta con pies algo más anchos que la cadera. Tocar el hombro opuesto minimizando la rotación pélvica.', 
    commonErrors: ['Bambolear la cadera de lado a lado al levantar la mano'] 
  },
  { 
    id: 'fn-04', 
    name: 'Escaladores (Mountain Climbers)', 
    muscleGroup: 'Funcional', 
    videoUrl: 'https://youtube.com/shorts/V0UoH5TG6fo?si=yJCQduYnA1MCvYOs', 
    technique: 'Hombros sobre muñecas en plancha. Llevar rodillas alternas hacia el pecho con ritmo explosivo y cadera baja.', 
    commonErrors: ['Elevar los glúteos hacia el techo formando una carpa', 'Rebotar la cabeza'] 
  },
  { 
    id: 'fn-05', 
    name: 'Jumping Jacks (Saltos de Tijera)', 
    muscleGroup: 'Funcional', 
    videoUrl: 'https://youtu.be/Omk6XKk-BZg?si=PsqRWdeJqSp9Hti0', 
    technique: 'Apertura simultánea y coordinada de pies y manos. Amortiguar el aterrizaje sobre metatarsos.', 
    commonErrors: ['Aterrizar con rodillas rígidas o talones secos'] 
  },
  { 
    id: 'fn-06', 
    name: 'Burpees Completos Kinetix', 
    muscleGroup: 'Funcional', 
    videoUrl: 'https://youtube.com/shorts/EkK3oVBA__Q?si=_aaScPjJPih7Dp4c', 
    technique: 'Apoyar manos, disparar pies atrás, pecho roza el suelo, rebotar pies a manos y salto vertical con palmada sobre la cabeza.', 
    commonErrors: ['Dejar caer la cadera al suelo sin tensión abdominal'] 
  },
  {
    id: 'fn-07',
    name: 'Thruster con Mancuernas / Barra',
    muscleGroup: 'Funcional',
    videoUrl: 'https://www.youtube.com/embed/5p7xFs_Hld4',
    technique: 'Sentadilla frontal profunda que transiciona sin pausa a press sobre la cabeza impulsado por caderas.',
    commonErrors: ['Separar la sentadilla del press como dos tiempos', 'Despegar talones']
  },
  {
    id: 'fn-08',
    name: 'Paseo del Granjero (Farmer Walk)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://www.youtube.com/embed/0cT1WmDBk2w',
    technique: 'Mancuernas o kettlebells pesadas a los lados. Caminata firme con hombros atrás y core activo.',
    commonErrors: ['Encorvarse hacia adelante', 'Dar pasos tambaleantes']
  },

  // ==========================================
  // --- ABDOMEN & CORE ---
  // ==========================================
  { 
    id: 'ab-01', 
    name: 'Crunch Abdominal Clásico', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtu.be/9VopAXZSZDA?si=-xZ7GCjf1O1FuyPh', 
    technique: 'Zona lumbar plana contra el suelo. Acercar las costillas a la pelvis mediante flexión torácica.', 
    commonErrors: ['Tirar del cuello con las manos', 'Elevar toda la espalda baja usando los flexores de cadera'] 
  },
  { 
    id: 'ab-02', 
    name: 'V-Ups (Abdominales en V)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtu.be/iP2fjvG0g3w?si=lMIUWpgdoO1xKRMS', 
    technique: 'Elevación sincronizada de piernas y torso formando una "V" en el aire. Tocar las puntas de los pies.', 
    commonErrors: ['Flexionar excesivamente las rodillas', 'Usar impulso descontrolado'] 
  },
  { 
    id: 'ab-03', 
    name: 'Pallof Press (Anti-rotación con Polea / Banda)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtu.be/o_CxFP4FJhA?si=OM_OseO0R5YFD1yf', 
    technique: 'De pie lateral a la polea a la altura del esternón. Extender brazos al frente resistiendo la fuerza de rotación.', 
    commonErrors: ['Girar el torso siguiendo la polea', 'Encoger hombros'] 
  },
  { 
    id: 'ab-04', 
    name: 'Giro en Polea (Woodchopper / Leñador)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/FM7sTCeyOrk?si=MIiQ7kAf2xpe0Asv', 
    technique: 'Diagonal de arriba a abajo o abajo a arriba con rotación controlada desde el core, pivotando sobre el pie trasero.', 
    commonErrors: ['Mover solo los brazos sin involucrar la faja abdominal'] 
  },
  { 
    id: 'ab-05', 
    name: 'Giro Ruso (Russian Twist)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/CqvohZl3rFo?si=W88vl3a2KhPz4b_E', 
    technique: 'Sentado en V con pies suspendidos o apoyados. Rotar el disco o mancuerna a cada lado tocando cerca de la cadera.', 
    commonErrors: ['Redondear la espalda lumbar excesivamente', 'Girar solo los brazos sin rotación torácica'] 
  },
  { 
    id: 'ab-06', 
    name: 'Elevación de Piernas (Leg Raises)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/6NA99YASwd8?si=B0kFzFzdWogifUco', 
    technique: 'En barra colgado o banco plano. Elevar las piernas basculando la pelvis hacia arriba para activar el recto inferior.', 
    commonErrors: ['Bambolear el cuerpo para ganar inercia', 'Arquear la espalda baja al bajar las piernas'] 
  },
  { 
    id: 'ab-07', 
    name: 'Crunch en Fitball (Pelota Suiza)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtu.be/_Bw3j1ckBpo?si=z7-IEl_NrjecADiT', 
    technique: 'Zona lumbar acomodada en la curvatura de la pelota. Mayor rango de hiperextensión fisiológica y contracción.', 
    commonErrors: ['Deslizarse por la pelota perdiendo el apoyo central'] 
  },
  { 
    id: 'ab-08', 
    name: 'Extensión en Fitball / Rueda Abdominal', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/q_iz2BBnRSI?si=wBO8qoLAfNOx4oBw', 
    technique: 'Rodar hacia adelante manteniendo pelvis en retroversión sin que caiga la zona lumbar.', 
    commonErrors: ['Hiperextensión lumbar al estirar'] 
  },
  { 
    id: 'ab-09', 
    name: 'Circuito TRX Abdomen (Suspension Core)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/1ItKDquJcEU?si=v-8VY9EwNPZHF_6V', 
    technique: 'Pies en estribos del TRX. Combinación de plancha, pikes (elevación de cadera) y encogimientos de rodillas.', 
    commonErrors: ['Dejar colapsar la zona media'] 
  },
  { 
    id: 'ab-10', 
    name: 'Circuito Completo de Abdomen Dinámico', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/3rAc5JfScUI?si=BUDVau8zw8czhsqx', 
    technique: 'Transición continua entre flexión, estabilidad anti-rotacional e isometría sin pausas.', 
    commonErrors: ['Pausar entre ejercicios degradando la tensión metabólica'] 
  },

  // ==========================================
  // --- ISOMÉTRICOS ---
  // ==========================================
  { 
    id: 'iso-01', 
    name: 'Plancha Baja en Antebrazos (Plank)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/3AM7L2k7BEw?si=vEbQE6-xEuzwHEdQ', 
    technique: 'Codos bajo los hombros. Empujar el suelo con antebrazos, apretar glúteos y cuádriceps creando tensión global.', 
    commonErrors: ['Dejar caer la cadera hacia el piso', 'Levantar los glúteos en triángulo'] 
  },
  { 
    id: 'iso-02', 
    name: 'Sentadilla Isométrica en Pared (Wall Sit)', 
    muscleGroup: 'Piernas', 
    videoUrl: 'https://youtube.com/shorts/Hx99A39dEMU?si=WHb1RoGc5h9oRGW5', 
    technique: 'Espalda totalmente apoyada en pared lisa. Rodillas y caderas a 90°. Brazos cruzados al pecho.', 
    commonErrors: ['Apoyar las manos sobre los muslos para descargar peso', 'Angulo superior a 90°'] 
  },
  { 
    id: 'iso-03', 
    name: 'Barquito Isométrico (Hollow Body Hold)', 
    muscleGroup: 'Abdomen', 
    videoUrl: 'https://youtube.com/shorts/lJoKi3-XYuw?si=IOLEJ4DGqawF40Xj', 
    technique: 'Espalda baja aplastada firmemente contra el suelo. Piernas juntas y brazos estirados rozando orejas en forma de canoa.', 
    commonErrors: ['Separar la zona lumbar del suelo (debe ser imposible pasar una mano por debajo)'] 
  },

  // ==========================================
  // --- HALTEROFILIA & POTENCIA OLÍMPICA ---
  // ==========================================
  { 
    id: 'hal-01', 
    name: 'Clean & Jerk (Dos Tiempos Olímpico)', 
    muscleGroup: 'Halterofilia', 
    videoUrl: 'https://www.youtube.com/embed/J2YH8S6-Pss', 
    technique: 'Cargada desde el suelo a hombros con recepción en sentadilla, seguida de split o push jerk sobre la cabeza.', 
    commonErrors: ['Tirar con brazos antes de la triple extensión de tobillo-rodilla-cadera', 'Pisar flojo en el split'] 
  },
  { 
    id: 'hal-02', 
    name: 'Snatch (Arrancada Olímpica)', 
    muscleGroup: 'Halterofilia', 
    videoUrl: 'https://www.youtube.com/embed/Ms2RPgtPxl0', 
    technique: 'Agarre ancho. La barra viaja en un solo movimiento fluido desde el piso hasta bloquear sobre la cabeza en sentadilla profunda.', 
    commonErrors: ['Alejar la barra del cuerpo creando un arco incontrolable', 'No bloquear codos a tiempo'] 
  },

  // ==========================================
  // --- FUNCIONAL EXPANDIDO & CONDITIONING ---
  // ==========================================
  {
    id: 'fn-07',
    name: 'Box Jumps (Saltos al Cajón Pliométrico)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/mw6iqu9K8DY?si=K_Xu-3xVsB0seUBL',
    technique: 'Carga explosiva con flexión de cadera y balanceo de brazos. Aterrizar suave en sentadilla parcial y extender cadera arriba.',
    commonErrors: ['Aterrizaje rígido sobre los talones', 'No extender completamente la cadera arriba del cajón']
  },
  {
    id: 'fn-08',
    name: 'Wall Balls (Lanzamiento Balón a Diana)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/yTDROg8zZsU?si=rcvKpx7tNuH2LrjC',
    technique: 'Sentadilla frontal profunda con balón medicinal en el pecho. Extensión explosiva y lanzamiento fluido hacia la marca.',
    commonErrors: ['No romper el paralelo en la sentadilla', 'Dejar caer el balón sobre el pecho sin amortiguar']
  },
  {
    id: 'fn-09',
    name: 'Slam Ball (Azote de Balón al Piso)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/ROAhRv5x-Ow?si=B-2TCElUrZMsRMaN',
    technique: 'Elevar balón sobre la cabeza con triple extensión completa. Azotar con fuerza hacia el suelo contrayendo el core agresivamente.',
    commonErrors: ['Doblar la columna lumbar sin flexionar caderas y rodillas', 'Mirar al frente en lugar de acompañar el balón']
  },
  {
    id: 'fn-10',
    name: 'Sled Push / Empuje de Trineo (Prowler)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/mw6iqu9K8DY?si=K_Xu-3xVsB0seUBL',
    technique: 'Brazos bloqueados o codos semiflexionados con torso a 45°. Pasos largos y potentes empujando desde el metatarso.',
    commonErrors: ['Flexionar excesivamente la zona lumbar', 'Dar pasos cortos sin tracción suficiente']
  },
  {
    id: 'fn-11',
    name: 'Farmer\'s Walk (Paseo del Granjero)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/cd2A4tYBLDs?si=cwQE2keI09kA79ls',
    technique: 'Mancuernas o trap bar pesadas a los lados. Escápulas retraídas, pecho alto y pasos cortos y estables.',
    commonErrors: ['Dejar que los hombros caigan hacia adelante', 'Bambolear el torso de lado a lado']
  },
  {
    id: 'fn-12',
    name: 'Kettlebell Clean & Press',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/ROAhRv5x-Ow?si=B-2TCElUrZMsRMaN',
    technique: 'Cargada desde el swing a posición de rack, seguida de press estricto o push press con bloqueo vertical.',
    commonErrors: ['Golpear el antebrazo con la pesa rusa en la transición', 'Arquear la columna en el bloqueo overhead']
  },
  {
    id: 'fn-13',
    name: 'Turkish Get-Up (Levantamiento Turco)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/lJoKi3-XYuw?si=IOLEJ4DGqawF40Xj',
    technique: 'Movimiento en 7 etapas manteniendo la mirada fija en la kettlebell con hombro activo y codo 100% bloqueado.',
    commonErrors: ['Doblar el codo del brazo que sostiene la carga', 'Apurar las fases de transición perdiendo estabilidad articular']
  },
  {
    id: 'fn-14',
    name: 'Bear Crawl (Paso del Oso Cuadrupedia)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/J9QSqLq4L6U?si=_g5ziS-Mc0CXFfzJ',
    technique: 'Cuadrupedia con rodillas a 2 cm del suelo. Mano y pie contralateral avanzan en sincronía manteniendo pelvis neutra.',
    commonErrors: ['Subir los glúteos en triángulo', 'Rotar la pelvis bruscamente en cada zancada']
  },
  {
    id: 'fn-15',
    name: 'Man Makers (Complejo Funcional Pesas)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/EkK3oVBA__Q?si=_aaScPjJPih7Dp4c',
    technique: 'Plancha con mancuernas + flexión + remo con mancuerna derecha + flexión + remo izquierdo + salto a squat + thruster.',
    commonErrors: ['Pesar demasiado y perder la alineación de la columna en los remos', 'Descoordinación en la sentadilla']
  },
  {
    id: 'fn-16',
    name: 'Australian Pull-Ups (Remos Invertidos en TRX / Barra)',
    muscleGroup: 'Funcional',
    videoUrl: 'https://youtube.com/shorts/1ItKDquJcEU?si=v-8VY9EwNPZHF_6V',
    technique: 'Cuerpo en plancha rígida. Tirar del pecho hacia las empuñaduras retrayendo escápulas al final del recorrido.',
    commonErrors: ['Quebrar la cadera hacia abajo', 'Tirar solo con bíceps sin juntar escápulas']
  },

  // ==========================================
  // --- PESAS & HIPERTROFIA AVANZADA ---
  // ==========================================
  {
    id: 'ch-10',
    name: 'Press Plano con Mancuernas (DB Bench Press)',
    muscleGroup: 'Pecho',
    videoUrl: 'https://youtu.be/g8oG_jaAxvs?si=ymgMP-_XlUqbZ3TH',
    technique: 'Mayor rango de estiramiento y trayectoria convergente natural para menor estrés glenohumeral.',
    commonErrors: ['Chocar las mancuernas bruscamente arriba', 'Bajar los codos alineados a 90° con los hombros']
  },
  {
    id: 'ch-11',
    name: 'Press Inclinado con Mancuernas',
    muscleGroup: 'Pecho',
    videoUrl: 'https://youtube.com/shorts/TNmeGZp9ols?si=k1mafvxCM_8ff2K3',
    technique: 'Inclinación de 30°. Conducir desde los codos manteniendo muñecas alineadas sobre los antebrazos.',
    commonErrors: ['Exceso de inclinación del banco', 'Perder la retracción escapular']
  },
  {
    id: 'ch-12',
    name: 'Cruce en Poleas Bajas (Low-to-High Cable Fly)',
    muscleGroup: 'Pecho',
    videoUrl: 'https://youtube.com/shorts/QEW6RO0O-ak?si=TscKmpKwbfMD6qVk',
    technique: 'Poleas a la altura de los tobillos. Tirar en diagonal ascendente hacia el nivel de la barbilla con codos fijos.',
    commonErrors: ['Flexionar los codos simulando curl de bíceps', 'Usar balanceo del tronco']
  },
  {
    id: 'bk-10',
    name: 'Remo con Mancuerna Apoyo en Pecho (Chest-Supported)',
    muscleGroup: 'Espalda',
    videoUrl: 'https://youtu.be/sOij1orUmbk?si=a1sXZqJvoPqK-FhG',
    technique: 'Banco a 30°-45°. Cero carga axial sobre la columna lumbar. Máximo foco en romboides, trapecio medio y dorsal.',
    commonErrors: ['Levantar el pecho del banco para ganar inercia', 'Tirar con el cuello']
  },
  {
    id: 'bk-11',
    name: 'Jalón al Pecho Agarre Neutro (V-Bar Pulldown)',
    muscleGroup: 'Espalda',
    videoUrl: 'https://youtube.com/shorts/Ks3yr_wl8WU?si=eilaLUFNwpvUh5w7',
    technique: 'Agarre en V o estrecho. Conducir los codos pegados al cuerpo hacia las costillas para máximo reclutamiento del dorsal.',
    commonErrors: ['Inclinarse hacia atrás más de 30° convirtiéndolo en un remo', 'Despegar los muslos del cojín']
  },
  {
    id: 'sh-09',
    name: 'Elevaciones Laterales en Polea (Cable Lateral Raise)',
    muscleGroup: 'Hombro',
    videoUrl: 'https://youtube.com/shorts/vwfaFckD1JI?si=JP_WjrUF4SVQbZts',
    technique: 'Cable pasando por detrás o delante a la altura de la rodilla. Tensión constante en el deltoides lateral desde el grado 0.',
    commonErrors: ['Elevar el trapecio encogiéndose de hombros', 'Exceso de peso que obliga a flexionar el torso']
  },
  {
    id: 'sh-10',
    name: 'Press de Hombro Sentado con Mancuernas',
    muscleGroup: 'Hombro',
    videoUrl: 'https://youtube.com/shorts/0ph4dQ4GOI4?si=aAqdYrWYNuY4T0Sr',
    technique: 'Banco a 75°-80°. Empujar en el plano escapular (codos 30° hacia adelante del torso). Bloqueo controlado arriba.',
    commonErrors: ['Despegar la espalda baja del respaldo', 'Abrir los codos completamente en línea recta con los hombros']
  },
  {
    id: 'bi-06',
    name: 'Curl en Banco Inclinado con Mancuernas (Cabeza Larga)',
    muscleGroup: 'Bíceps',
    videoUrl: 'https://youtube.com/shorts/XynAms-XSqs?si=NTFvHMnnMENckYeY',
    technique: 'Banco a 60°. Los brazos cuelgan perpendicularmente al suelo. Mayor estiramiento en la cabeza larga del bíceps.',
    commonErrors: ['Adelantar los hombros en la contracción', 'Balancear las mancuernas al inicio de la fase concéntrica']
  },
  {
    id: 'tr-07',
    name: 'Press Francés con Mancuernas en Banco Plano',
    muscleGroup: 'Tríceps',
    videoUrl: 'https://youtube.com/shorts/tU8nos4EoDQ?si=nBEx7Rwaf-RKBame',
    technique: 'Brazos inclinados a 80° hacia atrás para mantener tensión constante en la cabeza larga del tríceps.',
    commonErrors: ['Abrir los codos hacia afuera', 'Mover los hombros hacia adelante y atrás']
  },
  {
    id: 'qd-11',
    name: 'Prensa Inclinada Unilateral (A Una Pierna)',
    muscleGroup: 'Piernas',
    videoUrl: 'https://youtube.com/shorts/CZrG20G5B1g?si=jalpioPkL_AtWHso',
    technique: 'Pie centrado en la plataforma. Permite corregir asimetrías de fuerza entre cuádriceps izquierdo y derecho.',
    commonErrors: ['Despegar la cadera del lado activo', 'Bloquear la rodilla violentamente']
  },
  {
    id: 'qd-12',
    name: 'Sentadilla Búlgara con Mancuernas y Déficit',
    muscleGroup: 'Piernas',
    videoUrl: 'https://youtube.com/shorts/ODjwvOitOo0?si=PujSjXsS4VN2WC3m',
    technique: 'Pie trasero apoyado en banco. Pie delantero sobre disco para mayor profundidad y elongación de cuádriceps y glúteo.',
    commonErrors: ['Apoyar peso excesivo en la pierna trasera', 'Colapso de rodilla hacia adentro (valgo)']
  },
  {
    id: 'hm-09',
    name: 'Hiperextensiones a 45° Enfoque Isquio/Glúteo',
    muscleGroup: 'Piernas',
    videoUrl: 'https://youtube.com/shorts/9z6AYqXkBbY?si=iZgw0BHjmIKFMxIu',
    technique: 'Almohadilla justo debajo del pliegue de la cadera. Espalda redondeada intencionalmente para aislar glúteos e isquios.',
    commonErrors: ['Hiperextender la zona lumbar en la parte superior', 'Pies mal orientados']
  },
  {
    id: 'gl-07',
    name: 'Hip Thrust Unilateral con Mancuerna / Banda',
    muscleGroup: 'Glúteo',
    videoUrl: 'https://youtube.com/shorts/OK-PC9PVQWQ?si=BVAi8noSR3MdYhLS',
    technique: 'Escápulas apoyadas en banco. Empujar a través del talón de la pierna de apoyo manteniendo pelvis nivelada.',
    commonErrors: ['Rotar la cadera hacia el lado de la pierna libre', 'No alcanzar la extensión horizontal completa']
  },
  {
    id: 'iso-04',
    name: 'Copenhagen Plank (Plancha Copenhague Aductores)',
    muscleGroup: 'Abdomen',
    videoUrl: 'https://youtube.com/shorts/3AM7L2k7BEw?si=vEbQE6-xEuzwHEdQ',
    technique: 'Plancha lateral con la pierna superior apoyada en banco y la inferior suspendida o en el suelo. Gran carga en aductores.',
    commonErrors: ['Dejar caer la pelvis hacia abajo', 'Rotar el torso hacia el piso']
  },
  {
    id: 'iso-05',
    name: 'Puente de Glúteo Isométrico Unilateral',
    muscleGroup: 'Glúteo',
    videoUrl: 'https://youtube.com/shorts/Hx99A39dEMU?si=WHb1RoGc5h9oRGW5',
    technique: 'Tumbado en el suelo, una pierna elevada a 90°. Sostener la contracción máxima arriba empujando con el talón activo.',
    commonErrors: ['Arquear la zona lumbar para compensar falta de extensión de cadera']
  }
];
