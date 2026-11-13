import { Exercise, Workout, WorkoutExercise } from '../types/kinetix';

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

export const exportWorkoutsToCSV = (workouts: Workout[]) => {
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
  downloadCSV(`kinetix_rutinas_${new Date().toISOString().split('T')[0]}.csv`, csv);
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
