import { Exercise, Workout, WorkoutExercise, User, Goal, UserLevel } from '../types/kinetix';

const escapeCSV = (val: any): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const downloadCSV = (filename: string, csvContent: string) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Detecta automáticamente delimitador ',' o ';' (Excel en español usa ';')
const detectDelimiter = (headerLine: string): string => {
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const c = headerLine[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes) {
      if (c === ',') commas++;
      else if (c === ';') semis++;
    }
  }
  return semis > commas ? ';' : ',';
};

const parseCSVLine = (text: string, delimiter: string): string[] => {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
};

// =========================================================
// EJERCICIOS: EXPORTAR / PLANTILLA / IMPORTAR EXCEL (.CSV)
// =========================================================

export const exportExercisesToCSV = (exercises: Exercise[]) => {
  const headers = ['id', 'nombre', 'grupo_muscular', 'video_url', 'tecnica_cues', 'errores_comunes'];
  const rows = exercises.map(ex => [
    escapeCSV(ex.id),
    escapeCSV(ex.name),
    escapeCSV(ex.muscleGroup),
    escapeCSV(ex.videoUrl),
    escapeCSV(ex.technique || ''),
    escapeCSV((ex.commonErrors || []).join(' | '))
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(`kinetix_ejercicios_${new Date().toISOString().split('T')[0]}.csv`, csv);
};

export const downloadExercisesTemplateCSV = () => {
  const headers = ['id', 'nombre', 'grupo_muscular', 'video_url', 'tecnica_cues', 'errores_comunes'];
  const example1 = ['ex-ejemplo-1', 'Sentadilla Goblet', 'Piernas', 'https://www.youtube.com/watch?v=MeIiIdhvXT4', 'Pecho alto, rodillas alineadas con puntas', 'Colapsar rodillas | Despegar talones'];
  const example2 = ['', 'Remo con Mancuerna', 'Espalda', 'https://www.youtube.com/watch?v=roCP6wCXPqo', 'Llevar mancuerna hacia la cadera', 'Rotar el torso'];
  const csv = [headers.join(','), example1.map(escapeCSV).join(','), example2.map(escapeCSV).join(',')].join('\r\n');
  downloadCSV('plantilla_ejercicios_kinetix.csv', csv);
};

export const parseExercisesFromCSV = (csvText: string): Exercise[] => {
  const lines = csvText.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const header = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase());
  const idIdx = header.findIndex(h => h === 'id');
  const nameIdx = header.findIndex(h => h.includes('nombre') || h.includes('name'));
  const muscleIdx = header.findIndex(h => h.includes('grupo') || h.includes('muscle'));
  const videoIdx = header.findIndex(h => h.includes('video') || h.includes('link') || h.includes('url'));
  const cueIdx = header.findIndex(h => h.includes('tecnica') || h.includes('cue'));
  const errorIdx = header.findIndex(h => h.includes('error'));

  const parsedExercises: Exercise[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    const name = nameIdx >= 0 ? cols[nameIdx] : cols[1];
    if (!name || name.trim() === '') continue;

    const rawId = idIdx >= 0 ? cols[idIdx]?.trim() : '';
    parsedExercises.push({
      id: rawId || `ex-${Date.now()}-${i}`,
      name: name.trim(),
      muscleGroup: (muscleIdx >= 0 && cols[muscleIdx]) ? cols[muscleIdx].trim() : 'Funcional',
      videoUrl: (videoIdx >= 0 && cols[videoIdx]) ? cols[videoIdx].trim() : '',
      technique: (cueIdx >= 0 && cols[cueIdx]) ? cols[cueIdx].trim() : '',
      commonErrors: (errorIdx >= 0 && cols[errorIdx]) ? cols[errorIdx].split('|').map(s => s.trim()).filter(Boolean) : []
    });
  }

  return parsedExercises;
};

// =========================================================
// RUTINAS: EXPORTAR / PLANTILLA / IMPORTAR EXCEL (.CSV)
// =========================================================

export const exportWorkoutsToCSV = (workouts: Workout[], customFilename?: string) => {
  const headers = [
    'rutina_id',
    'rutina_nombre',
    'titulo_atleta',
    'categoria',
    'dia',
    'ejercicio_nombre',
    'series',
    'repeticiones',
    'peso_objetivo',
    'descanso_seg',
    'metodo',
    'rir',
    'tempo',
    'indicacion_coach',
    'video_url'
  ];

  const rows: string[][] = [];
  workouts.forEach(w => {
    const exs = w.exercises && w.exercises.length > 0 ? w.exercises : [null];
    exs.forEach(ex => {
      rows.push([
        escapeCSV(w.id),
        escapeCSV(w.name),
        escapeCSV(w.publicTitle || w.name),
        escapeCSV(w.category || 'general'),
        escapeCSV(w.day || 1),
        escapeCSV(ex ? ex.name : ''),
        escapeCSV(ex ? ex.targetSets : 3),
        escapeCSV(ex ? ex.targetReps : '10'),
        escapeCSV(ex ? (ex.targetLoad || '0') : '0'),
        escapeCSV(ex ? (ex.targetRest ?? 90) : 90),
        escapeCSV(ex ? (ex.method || 'standard') : 'standard'),
        escapeCSV(ex ? (ex.targetRir || '') : ''),
        escapeCSV(ex ? (ex.tempo || '') : ''),
        escapeCSV(ex ? (ex.coachCue || '') : ''),
        escapeCSV(ex ? (ex.videoUrl || '') : '')
      ]);
    });
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(customFilename || `kinetix_rutinas_${new Date().toISOString().split('T')[0]}.csv`, csv);
};

export const downloadWorkoutsTemplateCSV = () => {
  const headers = [
    'rutina_id',
    'rutina_nombre',
    'titulo_atleta',
    'categoria',
    'dia',
    'ejercicio_nombre',
    'series',
    'repeticiones',
    'peso_objetivo',
    'descanso_seg',
    'metodo',
    'rir',
    'tempo',
    'indicacion_coach',
    'video_url'
  ];
  const row1 = ['tpl-upper-excel', 'Torso Fuerza Excel', 'Torso Potencia A', 'general', '1', 'Press Horizontal', '4', '8, 8, 6, 6', '60, 65, 70, 70', '120', 'standard', '2', '3-0-1-0', 'Controla la bajada 3 seg', 'https://www.youtube.com/embed/g80G_jaAxvs'];
  const row2 = ['tpl-upper-excel', 'Torso Fuerza Excel', 'Torso Potencia A', 'general', '1', 'Remo Supino', '4', '10, 10, 8, 8', '50, 55, 60, 60', '90', 'standard', '2', '2-0-1-1', 'Pausa 1s atrás', 'https://www.youtube.com/embed/ZFkJocVACns'];
  const csv = [headers.join(','), row1.map(escapeCSV).join(','), row2.map(escapeCSV).join(',')].join('\r\n');
  downloadCSV('plantilla_rutinas_kinetix.csv', csv);
};

export const parseWorkoutsFromCSV = (csvText: string, catalogExercises: Exercise[]): Workout[] => {
  const lines = csvText.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const header = parseCSVLine(lines[0], delimiter).map(h => h.toLowerCase());

  const colIdx = (keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)));
  const idIdx = colIdx(['rutina_id', 'id']);
  const rNameIdx = colIdx(['rutina_nombre', 'rutina', 'workout']);
  const pubIdx = colIdx(['titulo_atleta', 'public']);
  const catIdx = colIdx(['categoria', 'category']);
  const dayIdx = colIdx(['dia', 'day']);
  const exNameIdx = colIdx(['ejercicio_nombre', 'ejercicio', 'exercise']);
  const setsIdx = colIdx(['series', 'sets']);
  const repsIdx = colIdx(['repeticiones', 'reps']);
  const loadIdx = colIdx(['peso', 'load', 'weight']);
  const restIdx = colIdx(['descanso', 'rest']);
  const methodIdx = colIdx(['metodo', 'method']);
  const rirIdx = colIdx(['rir']);
  const tempoIdx = colIdx(['tempo']);
  const cueIdx = colIdx(['indicacion', 'cue', 'nota']);
  const videoIdx = colIdx(['video', 'url', 'link']);

  const map = new Map<string, Workout>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    const rName = (rNameIdx >= 0 ? cols[rNameIdx] : cols[1])?.trim();
    if (!rName) continue;

    const rawId = (idIdx >= 0 ? cols[idIdx]?.trim() : '') || `tpl-csv-${rName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (!map.has(rawId)) {
      const rawCat = (catIdx >= 0 ? cols[catIdx]?.trim().toLowerCase() : 'general');
      const category: 'general' | 'travel' | 'personalizado' =
        rawCat.includes('travel') || rawCat.includes('viaje') || rawCat.includes('vacacion')
          ? 'travel'
          : rawCat.includes('personal')
          ? 'personalizado'
          : 'general';

      map.set(rawId, {
        id: rawId,
        name: rName,
        publicTitle: (pubIdx >= 0 && cols[pubIdx]?.trim()) || rName,
        category,
        day: parseInt(dayIdx >= 0 ? cols[dayIdx] : '1') || 1,
        isTemplate: true,
        exercises: []
      });
    }

    const exName = (exNameIdx >= 0 ? cols[exNameIdx] : '')?.trim();
    if (exName) {
      const matched = catalogExercises.find(e => e.name.toLowerCase() === exName.toLowerCase());
      const workoutEx: WorkoutExercise = {
        exerciseId: matched?.id || `ex-csv-${Date.now()}-${i}`,
        name: exName,
        targetSets: parseInt(setsIdx >= 0 ? cols[setsIdx] : '3') || 3,
        targetReps: (repsIdx >= 0 && cols[repsIdx]?.trim()) || '10',
        targetLoad: (loadIdx >= 0 && cols[loadIdx]?.trim()) || '0',
        targetRest: parseInt(restIdx >= 0 ? cols[restIdx] : '90') || 90,
        method: ((methodIdx >= 0 && cols[methodIdx]?.trim()) || 'standard') as any,
        targetRir: rirIdx >= 0 ? cols[rirIdx]?.trim() : undefined,
        tempo: tempoIdx >= 0 ? cols[tempoIdx]?.trim() : undefined,
        coachCue: (cueIdx >= 0 && cols[cueIdx]?.trim()) || matched?.technique || '',
        videoUrl: (videoIdx >= 0 && cols[videoIdx]?.trim()) || matched?.videoUrl || ''
      };
      map.get(rawId)!.exercises.push(workoutEx);
    }
  }

  return Array.from(map.values());
};

// =========================================================
// ATLETAS: EXPORTAR (CSV / XML) E IMPORTAR DESDE OTRA APP (NZANE / EXCEL / XML / CSV / JSON)
// =========================================================

const normalizeSlug = (name: string): string => {
  const clean = (name || 'atleta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.');
  return clean || `atleta.${Math.floor(100 + Math.random() * 900)}`;
};

const escapeXML = (val: any): string =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const mapGoal = (raw?: string): Goal => {
  const v = (raw || '').toLowerCase();
  if (v.includes('grasa') || v.includes('bajar') || v.includes('lose') || v.includes('defin')) return Goal.LOSE_FAT;
  if (v.includes('musc') || v.includes('hipert') || v.includes('masa') || v.includes('volumen')) return Goal.GAIN_MUSCLE;
  return Goal.PERFORMANCE;
};

const mapLevel = (raw?: string): UserLevel => {
  const v = (raw || '').toLowerCase();
  if (v.includes('avanz') || v.includes('adv') || v.includes('elite')) return UserLevel.ADVANCED;
  if (v.includes('inter') || v.includes('medio')) return UserLevel.INTERMEDIATE;
  return UserLevel.BEGINNER;
};

const mapAccessTier = (raw?: string): { accessTier: User['accessTier']; isUnlimited: boolean; medDefault: string } => {
  const v = (raw || '').toLowerCase();
  if (v.includes('vip') || v.includes('sin corte') || v.includes('ilimit')) {
    return { accessTier: 'vip_sin_corte', isUnlimited: true, medDefault: 'VIP / Sin Corte' };
  }
  if (v.includes('personal') || v.includes('1-on-1') || v.includes('jorge')) {
    return { accessTier: 'personalizado', isUnlimited: false, medDefault: 'Personalizado Jorge Gonzalez' };
  }
  if (v.includes('vacac') || v.includes('remot') || v.includes('hotel')) {
    return { accessTier: 'vacaciones', isUnlimited: false, medDefault: 'Remoto / Vacaciones' };
  }
  return { accessTier: 'regular', isUnlimited: false, medDefault: 'Importado Kinetix' };
};

const normalizeCycleDate = (raw?: string): string => {
  const s = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
};

export const exportAthletesToCSV = (athletes: User[]) => {
  const headers = [
    'nombre',
    'usuario',
    'email',
    'clave',
    'telefono',
    'plan_acceso',
    'vencimiento',
    'objetivo',
    'nivel',
    'dias_semana',
    'edad',
    'peso_kg',
    'activo',
    'notas'
  ];
  const rows = athletes
    .filter(a => a.role !== 'owner')
    .map(a => [
      escapeCSV(a.name),
      escapeCSV(a.username || normalizeSlug(a.name)),
      escapeCSV(a.email),
      escapeCSV(a.password || 'kinetix.atleta'),
      escapeCSV(a.phone || ''),
      escapeCSV(a.accessTier || (a.isUnlimited ? 'vip_sin_corte' : 'regular')),
      escapeCSV(a.cycleEndDate || ''),
      escapeCSV(a.goal || Goal.PERFORMANCE),
      escapeCSV(a.level || UserLevel.BEGINNER),
      escapeCSV(a.daysPerWeek || 4),
      escapeCSV(a.age ?? ''),
      escapeCSV(a.weight ?? ''),
      escapeCSV(a.isActive === false ? 'no' : 'si'),
      escapeCSV(a.medicalConditions || '')
    ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  downloadCSV(`kinetix_alumnos_${new Date().toISOString().split('T')[0]}.csv`, csv);
};

export const exportAthletesToXML = (athletes: User[]) => {
  const items = athletes
    .filter(a => a.role !== 'owner')
    .map(a => [
      '  <alumno>',
      `    <id>${escapeXML(a.id)}</id>`,
      `    <nombre>${escapeXML(a.name)}</nombre>`,
      `    <usuario>${escapeXML(a.username || normalizeSlug(a.name))}</usuario>`,
      `    <email>${escapeXML(a.email)}</email>`,
      `    <clave>${escapeXML(a.password || 'kinetix.atleta')}</clave>`,
      `    <telefono>${escapeXML(a.phone || '')}</telefono>`,
      `    <plan>${escapeXML(a.accessTier || 'regular')}</plan>`,
      `    <vencimiento>${escapeXML(a.cycleEndDate || '')}</vencimiento>`,
      `    <objetivo>${escapeXML(a.goal)}</objetivo>`,
      `    <nivel>${escapeXML(a.level)}</nivel>`,
      `    <dias_semana>${escapeXML(a.daysPerWeek || 4)}</dias_semana>`,
      `    <activo>${a.isActive === false ? 'false' : 'true'}</activo>`,
      `    <notas>${escapeXML(a.medicalConditions || '')}</notas>`,
      '  </alumno>'
    ].join('\n'))
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<kinetix_alumnos exportado="${new Date().toISOString()}">\n${items}\n</kinetix_alumnos>`;
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kinetix_alumnos_${new Date().toISOString().split('T')[0]}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAthletesTemplateCSV = () => {
  const headers = ['nombre', 'usuario', 'email', 'clave', 'telefono', 'plan_acceso', 'vencimiento', 'objetivo', 'nivel', 'dias_semana', 'notas'];
  const ex1 = ['María Fernanda López', 'maria.lopez', 'maria@correo.com', 'kinetix.atleta', '5512345678', 'regular', '2026-12-30', 'Rendimiento', 'Intermedio', '4', 'Migrada de sistema anterior'];
  const ex2 = ['Luis Enrique Pérez', 'luis.perez', 'luis@correo.com', 'kinetix.atleta', '5587654321', 'personalizado', '2026-12-30', 'Ganar Músculo', 'Avanzado', '5', 'Personalizado Jorge Gonzalez'];
  const csv = [headers.join(','), ex1.map(escapeCSV).join(','), ex2.map(escapeCSV).join(',')].join('\r\n');
  downloadCSV('plantilla_importar_alumnos_kinetix.csv', csv);
};

export interface ParsedAthleteImport {
  athletes: User[];
  format: 'XML' | 'CSV' | 'JSON';
  duplicateCount: number;
}

export const parseAthletesFromFile = (rawText: string, existingAthletes: User[] = []): ParsedAthleteImport => {
  const text = (rawText || '').trim().replace(/^\uFEFF/, '');
  if (!text) return { athletes: [], format: 'CSV', duplicateCount: 0 };

  const existingKeys = new Set<string>();
  existingAthletes.forEach(a => {
    if (a.email) existingKeys.add(a.email.toLowerCase());
    if (a.username) existingKeys.add(a.username.toLowerCase());
  });

  const buildAthlete = (rec: Record<string, string>, idx: number): User | null => {
    const pick = (keys: string[]): string => {
      for (const [k, v] of Object.entries(rec)) {
        const lk = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (keys.some(match => lk.includes(match)) && v && v.trim()) return v.trim();
      }
      return '';
    };

    const firstName = pick(['nombre', 'name', 'alumno', 'cliente', 'socio']);
    const lastName = pick(['apellido', 'lastname']);
    const fullName = lastName && !firstName.toLowerCase().includes(lastName.toLowerCase())
      ? `${firstName} ${lastName}`.trim()
      : firstName;
    if (!fullName) return null;

    const rawUsername = pick(['usuario', 'username', 'user', 'matricula', 'codigo']).toLowerCase().replace(/^@/, '').replace(/\s+/g, '.');
    const username = rawUsername || normalizeSlug(fullName);
    const rawEmail = pick(['email', 'correo', 'mail']).toLowerCase();
    const email = rawEmail && rawEmail.includes('@') ? rawEmail : `${username}@kinetix.local`;
    const password = pick(['clave', 'password', 'pass', 'contrasena', 'pin']) || 'kinetix.atleta';
    const phone = pick(['tel', 'cel', 'phone', 'whatsapp', 'movil']);
    const tierInfo = mapAccessTier(pick(['plan', 'tier', 'modalidad', 'membresia', 'tipo']));
    const cycleEndDate = normalizeCycleDate(pick(['vencimiento', 'corte', 'expir', 'fin', 'vigencia', 'cycle']));
    const goal = mapGoal(pick(['objetivo', 'goal', 'meta']));
    const level = mapLevel(pick(['nivel', 'level', 'exp']));
    const daysPerWeek = Math.min(7, Math.max(1, parseInt(pick(['dias', 'days', 'frec'])) || 4));
    const ageNum = parseInt(pick(['edad', 'age']));
    const weightNum = parseFloat(pick(['peso', 'weight']));
    const activeRaw = pick(['activo', 'active', 'estatus', 'status', 'estado']).toLowerCase();
    const isActive = !(activeRaw === 'no' || activeRaw === 'false' || activeRaw === '0' || activeRaw.includes('paus') || activeRaw.includes('inact') || activeRaw.includes('baja'));
    const notes = pick(['nota', 'observ', 'medic', 'lesion', 'coment']);

    return {
      id: `ath-imp-${Date.now()}-${idx}`,
      name: fullName,
      username,
      email,
      password,
      phone: phone || undefined,
      role: 'client',
      accessTier: tierInfo.accessTier,
      isUnlimited: tierInfo.isUnlimited,
      goal,
      level,
      daysPerWeek,
      equipment: ['Full Gym'],
      streak: 0,
      createdAt: new Date().toISOString(),
      isActive,
      cycleEndDate,
      age: !isNaN(ageNum) && ageNum > 0 ? ageNum : undefined,
      weight: !isNaN(weightNum) && weightNum > 0 ? weightNum : undefined,
      medicalConditions: notes || tierInfo.medDefault
    };
  };

  let rawRecords: Record<string, string>[] = [];
  let format: 'XML' | 'CSV' | 'JSON' = 'CSV';

  // 1. Detectar XML (<alumnos><alumno>...</alumno></alumnos> o exports tipo NZane / Excel XML)
  if (text.startsWith('<')) {
    format = 'XML';
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const candidateTags = ['alumno', 'atleta', 'cliente', 'socio', 'member', 'usuario', 'user', 'record', 'row', 'Row'];
      let nodes: Element[] = [];
      for (const tag of candidateTags) {
        const found = Array.from(doc.getElementsByTagName(tag));
        if (found.length > 0) {
          nodes = found;
          break;
        }
      }
      if (nodes.length === 0 && doc.documentElement) {
        nodes = Array.from(doc.documentElement.children).filter(el => el.children.length > 0 || el.attributes.length > 0);
      }
      rawRecords = nodes.map(el => {
        const rec: Record<string, string> = {};
        Array.from(el.attributes).forEach(attr => {
          rec[attr.name] = attr.value;
        });
        Array.from(el.children).forEach(child => {
          if (child.textContent) rec[child.tagName] = child.textContent.trim();
        });
        return rec;
      });
    } catch {
      rawRecords = [];
    }
  } else if (text.startsWith('[') || text.startsWith('{')) {
    // 2. Detectar JSON
    format = 'JSON';
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed)
        ? parsed
        : parsed.athletes || parsed.alumnos || parsed.clientes || parsed.users || parsed.data || [];
      if (Array.isArray(arr)) {
        rawRecords = arr.map((item: any) => {
          const rec: Record<string, string> = {};
          if (item && typeof item === 'object') {
            Object.entries(item).forEach(([k, v]) => {
              if (v !== undefined && v !== null) rec[k] = String(v);
            });
          }
          return rec;
        });
      }
    } catch {
      rawRecords = [];
    }
  } else {
    // 3. Detectar CSV o TSV (Excel / Google Sheets / Export de otra app)
    format = 'CSV';
    const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length >= 2) {
      const delimiter = lines[0].includes('\t') ? '\t' : detectDelimiter(lines[0]);
      const headers = parseCSVLine(lines[0], delimiter);
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter);
        const rec: Record<string, string> = {};
        headers.forEach((h, colIdx) => {
          if (h) rec[h] = cols[colIdx] || '';
        });
        rawRecords.push(rec);
      }
    }
  }

  const athletes: User[] = [];
  let duplicateCount = 0;
  const batchSeen = new Set<string>();

  rawRecords.forEach((rec, idx) => {
    const u = buildAthlete(rec, idx);
    if (!u) return;
    const emailKey = u.email.toLowerCase();
    const userKey = (u.username || '').toLowerCase();
    if (batchSeen.has(emailKey) || batchSeen.has(userKey)) return;
    batchSeen.add(emailKey);
    batchSeen.add(userKey);
    if (existingKeys.has(emailKey) || existingKeys.has(userKey)) duplicateCount++;
    athletes.push(u);
  });

  return { athletes, format, duplicateCount };
};
