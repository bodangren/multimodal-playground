import {
  isImageGenerationCapableModel,
  listOpenRouterImageGenerationModels,
  type OpenRouterModelCatalogEntry,
} from './openrouter-models';

export type { OpenRouterModelCatalogEntry, OpenRouterModelOption } from './openrouter-models';
export {
  formatOpenRouterModelLabel,
  isImageCapableModel,
  listOpenRouterImageGenerationModels,
  listOpenRouterImageModels,
  listOpenRouterModels,
  listOpenRouterTextModels,
  toOpenRouterModelOption,
} from './openrouter-models';

export type ImageModelSelectionOptions = {
  preferredModelId?: string;
  allowFallback?: boolean;
};

export function resolveImageModelId(
  models: OpenRouterModelCatalogEntry[],
  options: ImageModelSelectionOptions = {}
) {
  const { preferredModelId, allowFallback = true } = options;
  const preferredModel = preferredModelId ? models.find((model) => model.id === preferredModelId) : null;

  if (preferredModel && isImageGenerationCapableModel(preferredModel)) {
    return preferredModel.id;
  }

  const fallbackModel = models.find(isImageGenerationCapableModel);

  if (preferredModelId && !allowFallback) {
    throw new Error(`Model ${preferredModelId} does not support image generation`);
  }

  if (fallbackModel) {
    return fallbackModel.id;
  }

  if (preferredModelId) {
    throw new Error(
      `Model ${preferredModelId} does not support text-to-image generation and no compatible fallback was found`
    );
  }

  throw new Error('No OpenRouter text-to-image models were found');
}

export async function getDefaultOpenRouterImageModelId(options: ImageModelSelectionOptions = {}) {
  const models = await listOpenRouterImageGenerationModels();
  return resolveImageModelId(models, options);
}

export async function selectOpenRouterImageModelId(preferredModelId?: string) {
  const models = await listOpenRouterImageGenerationModels();

  if (preferredModelId) {
    return resolveImageModelId(models, {
      preferredModelId,
      allowFallback: false,
    });
  }

  return resolveImageModelId(models);
}
