import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { listOpenRouterVideoGenerationModels } from '../src/lib/openrouter-models';

const models = await listOpenRouterVideoGenerationModels();

console.log(
  JSON.stringify(
    models.map((model) => ({
      id: model.id,
      name: model.name ?? null,
      architecture: model.architecture ?? null,
    })),
    null,
    2
  )
);
