import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getOpenRouterApiUrl, getOpenRouterAuthHeaders } from '@/lib/provider';

const OpenRouterModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  architecture: z
    .object({
      output_modalities: z.array(z.string().min(1)).optional(),
      modality: z.string().min(1).optional(),
    })
    .optional(),
});

const OpenRouterModelCatalogResponseSchema = z.object({
  data: z.array(OpenRouterModelSchema),
});

export type OpenRouterModelCatalogEntry = z.infer<typeof OpenRouterModelSchema>;

export type ImageModelSelectionOptions = {
  preferredModelId?: string;
  allowFallback?: boolean;
};

export function isImageCapableModel(model: OpenRouterModelCatalogEntry) {
  const outputModalities = model.architecture?.output_modalities ?? [];
  const modality = model.architecture?.modality?.toLowerCase() ?? '';

  return outputModalities.some((value) => value.toLowerCase() === 'image') || modality.includes('image');
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

export async function listOpenRouterImageModels() {
  const models = await listOpenRouterModels();
  return models.filter(isImageCapableModel);
}

export function resolveImageModelId(
  models: OpenRouterModelCatalogEntry[],
  options: ImageModelSelectionOptions = {}
) {
  const { preferredModelId, allowFallback = true } = options;
  const preferredModel = preferredModelId ? models.find((model) => model.id === preferredModelId) : null;

  if (preferredModel && isImageCapableModel(preferredModel)) {
    return preferredModel.id;
  }

  const fallbackModel = models.find(isImageCapableModel);

  if (preferredModelId && !allowFallback) {
    throw new Error(`Model ${preferredModelId} does not support image generation`);
  }

  if (fallbackModel) {
    return fallbackModel.id;
  }

  if (preferredModelId) {
    throw new Error(
      `Model ${preferredModelId} does not support image generation and no image-capable fallback was found`
    );
  }

  throw new Error('No OpenRouter image-capable models were found');
}

export async function getDefaultOpenRouterImageModelId(options: ImageModelSelectionOptions = {}) {
  const models = await listOpenRouterImageModels();
  return resolveImageModelId(models, options);
}
