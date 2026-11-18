import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env / .env.local without external dotenv dependency
for (const envFile of ['.env', '.env.local']) {
  const fullPath = path.resolve(__dirname, envFile);
  if (fs.existsSync(fullPath)) {
    for (const line of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = 'gemini-4-hydrogen';

function extractResponseText(response: unknown): string {
  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates;
  if (!candidates || candidates.length === 0) return '';
  const parts = candidates[0]?.content?.parts || [];
  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

function getGeminiApiKey(): string {
  const raw = process.env.GEMINI_API_KEY || '';
  return raw.trim();
}

function isGeminiKeyValid(key: string): boolean {
  return key.length > 10 && !key.includes('placeholder') && !key.includes('tu_clave');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const apiKey = getGeminiApiKey();
    res.json({
      ok: true,
      geminiConfigured: isGeminiKeyValid(apiKey),
      model: GEMINI_MODEL
    });
  });

  app.post('/api/coach-directive', async (req: Request, res: Response) => {
    const apiKey = getGeminiApiKey();
    if (!isGeminiKeyValid(apiKey)) {
      res.status(503).json({
        error: 'GEMINI_API_KEY no está configurada en el servidor. Agrégala en el panel Secrets para activar Directriz del Coach con Gemini.'
      });
      return;
    }

    const {
      athleteName,
      goal,
      level,
      daysPerWeek,
      sessionsCount,
      avgRpe,
      avgFatigue,
      totalTonnageKg,
      daysSinceLastWorkout,
      topPRs,
      recentSessions
    } = req.body || {};

    if (!athleteName) {
      res.status(400).json({ error: 'Faltan datos del atleta para generar la directriz.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const compactContext = {
        atleta: String(athleteName),
        objetivo: String(goal || 'Rendimiento'),
        nivel: String(level || 'Intermedio'),
        frecuenciaSemanal: Number(daysPerWeek || 4),
        sesionesRegistradas: Number(sessionsCount || 0),
        rpePromedio: avgRpe ?? null,
        fatigaPromedio: avgFatigue ?? null,
        tonelajeRecienteKg: Number(totalTonnageKg || 0),
        diasSinEntrenar: daysSinceLastWorkout ?? null,
        recordsPR: Array.isArray(topPRs) ? topPRs.slice(0, 4) : [],
        ultimasSesiones: Array.isArray(recentSessions) ? recentSessions.slice(0, 6) : []
      };

      const systemInstruction = [
        'Eres el Head Coach asistente de metodología científica de Kinetix Functional Zone (Lic. Jorge González y Leslie Barrera).',
        'Analiza el historial resumido del atleta y entrega directrices tácticas breves, accionables y precisas en español.',
        'Si hay RPE >= 8.5 o fatiga >= 4, prioriza ajuste de RIR/descarga o control técnico.',
        'Si hay >= 4 días sin entrenar, prioriza readaptación progresiva.',
        'No inventes datos ni prometas cosas fuera del historial provisto. Sé directo y conciso.'
      ].join(' ');

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Genera la Directriz del Coach para este historial del atleta:\n${JSON.stringify(compactContext)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: 'Título corto (máx 8 palabras) del estado actual del atleta.'
              },
              primaryDirective: {
                type: Type.STRING,
                description: 'Directriz técnica principal lista para pegar como indicación en la próxima rutina (máx 25 palabras).'
              },
              loadAdjustment: {
                type: Type.STRING,
                description: 'Ajuste concreto de carga, volumen o RIR para los próximos días.'
              },
              recoveryAlert: {
                type: Type.STRING,
                description: 'Estado breve de fatiga, adherencia o recuperación.'
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de 2 a 3 acciones puntuales para la semana.'
              }
            },
            required: ['headline', 'primaryDirective', 'loadAdjustment', 'recoveryAlert', 'suggestions']
          }
        }
      });

      const rawText = extractResponseText(response);
      if (!rawText) {
        res.status(502).json({ error: 'Gemini devolvió una respuesta vacía.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({
        ...parsed,
        model: GEMINI_MODEL,
        generatedAt: new Date().toISOString()
      });
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      const status = typeof e?.status === 'number' && e.status >= 400 && e.status < 600 ? e.status : 500;
      res.status(status).json({
        error: e?.message || 'Error al consultar la API de Gemini.'
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinetix server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
