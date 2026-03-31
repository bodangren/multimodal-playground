import { errorMessage } from '@/lib/errors';
import {
  isTextCapableModel,
  listOpenRouterImageGenerationModels,
  listOpenRouterModels,
  listOpenRouterTranscriptionModels,
  listOpenRouterVideoGenerationModels,
  type OpenRouterModelOption,
  toOpenRouterModelOption,
} from '@/lib/openrouter-models';
import PlaygroundClient from './page-client';

export default async function Page() {
  let textModelOptions: OpenRouterModelOption[] = [];
  let imageModelOptions: OpenRouterModelOption[] = [];
  let transcriptionModelOptions: OpenRouterModelOption[] = [];
  let videoModelOptions: OpenRouterModelOption[] = [];
  let modelLoadError: string | null = null;

  try {
    const [models, imageModels, transcriptionModels, videoModels] = await Promise.all([
      listOpenRouterModels(),
      listOpenRouterImageGenerationModels(),
      listOpenRouterTranscriptionModels(),
      listOpenRouterVideoGenerationModels(),
    ]);

    textModelOptions = models.filter(isTextCapableModel).map(toOpenRouterModelOption);
    imageModelOptions = imageModels.map(toOpenRouterModelOption);
    transcriptionModelOptions = transcriptionModels.map(toOpenRouterModelOption);
    videoModelOptions = videoModels.map(toOpenRouterModelOption);
  } catch (error) {
    modelLoadError = errorMessage(error, 'Unable to load OpenRouter models');
  }

  return (
    <PlaygroundClient
      textModelOptions={textModelOptions}
      imageModelOptions={imageModelOptions}
      transcriptionModelOptions={transcriptionModelOptions}
      videoModelOptions={videoModelOptions}
      modelLoadError={modelLoadError}
    />
  );
}
