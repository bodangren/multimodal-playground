import { listOpenRouterModels, type OpenRouterModelCatalogEntry } from '@/lib/openrouter-models';

export type OpenAIModelEntry = {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
};

export type OpenAIModelsResponse = {
  object: 'list';
  data: OpenAIModelEntry[];
};

function toOpenAIModelEntry(model: OpenRouterModelCatalogEntry): OpenAIModelEntry {
  return {
    id: model.id,
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: 'openrouter',
  };
}

export async function listOpenAICompatModels(): Promise<OpenAIModelsResponse> {
  const models = await listOpenRouterModels();
  return {
    object: 'list',
    data: models.map(toOpenAIModelEntry),
  };
}
