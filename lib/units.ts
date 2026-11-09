// MOTOR DE CONVERSIÓN Y GESTIÓN DE UNIDADES (KG / LBS) KINETIX FUNCTIONAL ZONE
// Permite alternar y visualizar equivalencias exactas para barras olímpicas, mancuernas y placas

export const KG_TO_LBS = 2.20462;
export const LBS_TO_KG = 0.453592;

export type WeightUnit = 'kg' | 'lbs';

export const toLbs = (kg: number): number => {
  if (isNaN(kg) || kg <= 0) return 0;
  return Math.round(kg * KG_TO_LBS * 10) / 10;
};

export const toKg = (lbs: number): number => {
  if (isNaN(lbs) || lbs <= 0) return 0;
  return Math.round(lbs * LBS_TO_KG * 10) / 10;
};

export const convertWeight = (val: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return val;
  return from === 'kg' ? toLbs(val) : toKg(val);
};

export const getWeightEquivalenceHint = (val: number | string, unit: WeightUnit): string => {
  const num = typeof val === 'string' ? parseFloat(val.trim()) : val;
  if (isNaN(num) || num <= 0) return '';
  if (unit === 'kg') {
    const lbs = toLbs(num);
    return `≈ ${lbs} lbs`;
  } else {
    const kg = toKg(num);
    return `≈ ${kg} kg`;
  }
};
