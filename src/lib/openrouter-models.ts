import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getOpenRouterApiUrl, getOpenRouterAuthHeaders } from '@/lib/provider';

const OpenRouterModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  architecture: z
    .object({
      input_modalities: z.array(z.string().min(1)).optional(),
      output_modalities: z.array(z.string().min(1)).optional(),
      modality: z.string().min(1).optional(),
    })
    .optional(),
});

const OpenRouterModelCatalogResponseSchema = z.object({
  data: z.array(OpenRouterModelSchema),
});

export type OpenRouterModelCatalogEntry = z.infer<typeof OpenRouterModelSchema>;

export type OpenRouterModelOption = {
  id: string;
  label: string;
};

function parseModalitySide(modality: string | undefined, side: 'input' | 'output') {
  if (!modality) {
    return [];
  }

  const [inputPart = '', outputPart = ''] = modality.toLowerCase().split('->');
  const selectedPart = side === 'input' ? inputPart : outputPart;

  return selectedPart
    .split('+')
    .map((value) => value.trim())
    .filter(Boolean);
}

function matchesInputType(model: OpenRouterModelCatalogEntry, targetType: 'text' | 'image') {
  const inputModalities = model.architecture?.input_modalities ?? [];
  const modalityInputs = parseModalitySide(model.architecture?.modality, 'input');

  return [...inputModalities, ...modalityInputs].some((value) => value.toLowerCase() === targetType);
}

function matchesOutputType(model: OpenRouterModelCatalogEntry, targetType: 'text' | 'image') {
  const outputModalities = model.architecture?.output_modalities ?? [];
  const modalityOutputs = parseModalitySide(model.architecture?.modality, 'output');

  return [...outputModalities, ...modalityOutputs].some((value) => value.toLowerCase() === targetType);
}

export function isTextCapableModel(model: OpenRouterModelCatalogEntry) {
  return matchesOutputType(model, 'text');
}

export function isImageCapableModel(model: OpenRouterModelCatalogEntry) {
  return matchesOutputType(model, 'image');
}

export function isImageGenerationCapableModel(model: OpenRouterModelCatalogEntry) {
  return matchesInputType(model, 'text') && matchesOutputType(model, 'image');
}

export function formatOpenRouterModelLabel(model: OpenRouterModelCatalogEntry) {
  const trimmedName = model.name?.trim();

  if (!trimmedName || trimmedName === model.id) {
    return model.id;
  }

  return `${trimmedName} (${model.id})`;
}

export function toOpenRouterModelOption(model: OpenRouterModelCatalogEntry): OpenRouterModelOption {
  return {
    id: model.id,
    label: formatOpenRouterModelLabel(model),
  };
}

export async function listOpenRouterModels() {
  try {
    const response = await fetch(getOpenRouterApiUrl('/models'), {
      headers: {
        ...getOpenRouterAuthHeaders(),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter model catalog request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    return OpenRouterModelCatalogResponseSchema.parse(payload).data;
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to list OpenRouter models'), { cause: error });
  }
}

async function listOpenRouterModelsByQuery(query: string) {
  try {
    const response = await fetch(getOpenRouterApiUrl(`/models?${query}`), {
      headers: {
        ...getOpenRouterAuthHeaders(),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter model catalog request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    return OpenRouterModelCatalogResponseSchema.parse(payload).data;
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to list OpenRouter models'), { cause: error });
  }
}

export async function listOpenRouterTextModels() {
  const models = await listOpenRouterModels();
  return models.filter(isTextCapableModel);
}

export async function listOpenRouterImageGenerationModels() {
  return listOpenRouterModelsByQuery('input_modalities=text&output_modalities=image');
}

export async function listOpenRouterImageModels() {
  return listOpenRouterImageGenerationModels();
}

export async function listOpenRouterSpeechGenerationModels() {
  return listOpenRouterModelsByQuery('input_modalities=text&output_modalities=audio');
}

export async function listOpenRouterTranscriptionModels() {
  const models = await listOpenRouterModelsByQuery('input_modalities=audio&output_modalities=text');
  return models.filter((model) => {
    const inputs = model.architecture?.input_modalities ?? [];
    return inputs.includes('audio');
  });
}

export async function listOpenRouterVideoGenerationModels() {
  return listOpenRouterModelsByQuery('input_modalities=text&output_modalities=video');
}
