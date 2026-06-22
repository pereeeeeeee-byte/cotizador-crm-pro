import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import type { Service } from '@prisma/client';

interface AiQuoteDraft {
  suggestedServiceId: string | null;
  suggestedServiceName: string | null;
  professionalDescription: string;
  suggestedScope: string;
  suggestedBasePrice: number | null;
  confidence: 'alta' | 'media' | 'baja';
}

/**
 * Heurística simple de respaldo (sin IA) basada en palabras clave del catálogo
 * de servicios típico de topografía/regularización. Se usa cuando no hay
 * OPENAI_API_KEY configurada, para que el módulo de IA funcione "out of the
 * box" sin depender de un proveedor externo.
 */
function heuristicMatch(text: string, services: Service[]) {
  const lower = text.toLowerCase();
  const keywordsByService: Record<string, string[]> = {
    subdivisión: ['subdivid', 'subdivisión', 'dividir', 'lotes', 'parcela'],
    loteo: ['loteo', 'lotear'],
    'fusión predial': ['fusion', 'fusión', 'unir terreno', 'unificar'],
    'regularización de vivienda': ['regulariz', 'vivienda social', 'construccion irregular'],
    'levantamiento topográfico': ['levantamiento', 'topográfico', 'topografico', 'medir terreno', 'planimetría'],
    'certificación de deslindes': ['deslinde', 'limite', 'límite', 'cerco'],
    'cálculo de superficies': ['superficie', 'metros cuadrados', 'm2', 'm²'],
  };

  let bestMatch: { id: string; name: string; basePrice: unknown } | null = null;
  let bestScore = 0;

  for (const service of services) {
    const serviceNameLower = service.name.toLowerCase();
    let score = 0;

    for (const [key, keywords] of Object.entries(keywordsByService)) {
      if (serviceNameLower.includes(key)) {
        for (const kw of keywords) {
          if (lower.includes(kw)) score += 2;
        }
      }
    }
    // match directo por nombre
    if (lower.includes(serviceNameLower)) score += 3;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = service;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

async function callOpenAi(prompt: string): Promise<string | null> {
  if (!env.openai.apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: env.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente experto en topografía, construcción y regularización de propiedades en Chile. Respondes siempre en JSON válido, sin texto adicional.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export class AiQuoteService {
  static async draftFromDescription(organizationId: string, clientNeedDescription: string): Promise<AiQuoteDraft> {
    const services: Service[] = await prisma.service.findMany({ where: { organizationId, isActive: true } });

    // 1. Intentar con OpenAI si hay API key configurada
    if (env.openai.apiKey) {
      const serviceList = services.map((s) => `- ${s.name} (precio base: ${s.basePrice})`).join('\n');
      const prompt = `Un cliente describe lo que necesita: "${clientNeedDescription}".

Catálogo de servicios disponibles:
${serviceList}

Responde SOLO con un JSON con esta forma exacta:
{
  "suggestedServiceName": "nombre del servicio del catálogo que mejor calza, o null si ninguno calza bien",
  "professionalDescription": "descripción profesional y formal de 2-3 frases para usar en una cotización",
  "suggestedScope": "alcance del trabajo sugerido, en 1-2 frases",
  "suggestedBasePrice": numero o null,
  "confidence": "alta" | "media" | "baja"
}`;

      const raw = await callOpenAi(prompt);
      if (raw) {
        try {
          const cleaned = raw.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          const matchedService = services.find(
            (s) => s.name.toLowerCase() === String(parsed.suggestedServiceName ?? '').toLowerCase()
          );
          return {
            suggestedServiceId: matchedService?.id ?? null,
            suggestedServiceName: matchedService?.name ?? parsed.suggestedServiceName ?? null,
            professionalDescription: parsed.professionalDescription ?? clientNeedDescription,
            suggestedScope: parsed.suggestedScope ?? '',
            suggestedBasePrice: parsed.suggestedBasePrice ?? matchedService?.basePrice ?? null,
            confidence: parsed.confidence ?? 'media',
          };
        } catch {
          // si el parseo falla, cae al fallback heurístico
        }
      }
    }

    // 2. Fallback heurístico (sin IA externa)
    const match = heuristicMatch(clientNeedDescription, services);

    const professionalDescription = match
      ? `Se requiere realizar el servicio de ${match.name.toLowerCase()} conforme a lo descrito por el cliente: "${clientNeedDescription}". El trabajo incluye las gestiones técnicas y administrativas necesarias para su correcta ejecución.`
      : `Se requiere evaluar y ejecutar el trabajo solicitado por el cliente: "${clientNeedDescription}". Se recomienda agendar una visita técnica para definir el alcance exacto.`;

    return {
      suggestedServiceId: match?.id ?? null,
      suggestedServiceName: match?.name ?? null,
      professionalDescription,
      suggestedScope: match
        ? `Incluye levantamiento de información, trámites asociados a ${match.name.toLowerCase()} y entrega de documentación correspondiente.`
        : 'Alcance por definir tras visita técnica inicial.',
      suggestedBasePrice: match ? Number(match.basePrice) : null,
      confidence: match ? 'media' : 'baja',
    };
  }
}
