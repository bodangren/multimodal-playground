import { errorMessage } from '@/lib/errors';
import {
  isTextCapableModel,
  listOpenRouterImageGenerationModels,
  listOpenRouterModels,
  listOpenRouterSpeechGenerationModels,
  listOpenRouterTranscriptionModels,
  listOpenRouterVideoGenerationModels,
  type OpenRouterModelOption,
  toOpenRouterModelOption,
} from '@/lib/openrouter-models';
import PlaygroundClient from './page-client';

export default async function Page() {
  let textModelOptions: OpenRouterModelOption[] = [];
  let imageModelOptions: OpenRouterModelOption[] = [];
  let speechModelOptions: OpenRouterModelOption[] = [];
  let transcriptionModelOptions: OpenRouterModelOption[] = [];
  let videoModelOptions: OpenRouterModelOption[] = [];
  let modelLoadError: string | null = null;

  try {
    const [models, imageModels, speechModels, transcriptionModels, videoModels] = await Promise.all([
      listOpenRouterModels(),
      listOpenRouterImageGenerationModels(),
      listOpenRouterSpeechGenerationModels(),
      listOpenRouterTranscriptionModels(),
      listOpenRouterVideoGenerationModels(),
    ]);

    textModelOptions = models.filter(isTextCapableModel).map(toOpenRouterModelOption);
    imageModelOptions = imageModels.map(toOpenRouterModelOption);
    speechModelOptions = speechModels.map(toOpenRouterModelOption);
    transcriptionModelOptions = transcriptionModels.map(toOpenRouterModelOption);
    videoModelOptions = videoModels.map(toOpenRouterModelOption);
  } catch (error) {
    modelLoadError = errorMessage(error, 'Unable to load OpenRouter models');
  }

  return (
    <PlaygroundClient
      textModelOptions={textModelOptions}
      imageModelOptions={imageModelOptions}
      speechModelOptions={speechModelOptions}
      transcriptionModelOptions={transcriptionModelOptions}
      videoModelOptions={videoModelOptions}
      modelLoadError={modelLoadError}
    />
  );
}
