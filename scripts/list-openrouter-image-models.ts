import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { listOpenRouterImageModels } from '../src/lib/openrouter-image-models';

const models = await listOpenRouterImageModels();

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
