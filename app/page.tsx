"use client";

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { StructuredSchemaName } from '@/lib/schemas/product';

type TextResponse = {
  text: string;
  modelId: string;
  responseId: string;
  providerMetadata: Record<string, unknown>;
};

type StructuredResponse = {
  schema: StructuredSchemaName;
  data: Record<string, unknown>;
  text: string;
  modelId: string;
  responseId: string;
  providerMetadata: Record<string, unknown>;
};

type ImageResponse = {
  prompt: string;
  modelId: string;
  imageDataUrl: string;
  mediaType: string;
  response: { timestamp: string; modelId: string } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

type SpeechResponse = {
  text: string;
  voice?: string;
  modelId: string;
  audioDataUrl: string;
  mediaType: string;
  response: { timestamp: string; modelId: string } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

type TranscriptionResponse = {
  text: string;
  segments: Array<{ text: string; startSecond: number; endSecond: number }>;
  language?: string | null;
  durationInSeconds?: number | null;
  modelId: string;
  response: { timestamp: string; modelId: string } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

type VideoResponse = {
  prompt: string;
  modelId: string;
  videoDataUrl: string;
  mediaType: string;
  response: { timestamp: string; modelId: string } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error?: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

async function postFormData<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error?: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function Page() {
  const [textPrompt, setTextPrompt] = useState('Write a short product tagline for an AI playground.');
  const [textResult, setTextResult] = useState<TextResponse | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  const [structuredPrompt, setStructuredPrompt] = useState('Create a concise product summary for a creative AI assistant.');
  const [structuredResult, setStructuredResult] = useState<StructuredResponse | null>(null);
  const [structuredError, setStructuredError] = useState<string | null>(null);
  const [structuredLoading, setStructuredLoading] = useState(false);

  const [imagePrompt, setImagePrompt] = useState('A neon robot portrait on a clean studio backdrop.');
  const [imageResult, setImageResult] = useState<ImageResponse | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [speechText, setSpeechText] = useState('Hello from the AI playground.');
  const [speechVoice, setSpeechVoice] = useState('alloy');
  const [speechResult, setSpeechResult] = useState<SpeechResponse | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechLoading, setSpeechLoading] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResponse | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState('A cinematic skyline at dusk with soft neon reflections.');
  const [videoResult, setVideoResult] = useState<VideoResponse | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const submitText = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTextLoading(true);
    setTextError(null);

    try {
      const result = await postJson<TextResponse>('/api/generate-text', { prompt: textPrompt });
      setTextResult(result);
    } catch (error) {
      setTextResult(null);
      setTextError(error instanceof Error ? error.message : 'Text generation failed');
    } finally {
      setTextLoading(false);
    }
  };

  const submitStructured = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStructuredLoading(true);
    setStructuredError(null);

    try {
      const result = await postJson<StructuredResponse>('/api/generate-structured', {
        prompt: structuredPrompt,
        schema: 'product',
      });
      setStructuredResult(result);
    } catch (error) {
      setStructuredResult(null);
      setStructuredError(error instanceof Error ? error.message : 'Structured generation failed');
    } finally {
      setStructuredLoading(false);
    }
  };

  const submitImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImageLoading(true);
    setImageError(null);

    try {
      const result = await postJson<ImageResponse>('/api/generate-image', { prompt: imagePrompt });
      setImageResult(result);
    } catch (error) {
      setImageResult(null);
      setImageError(error instanceof Error ? error.message : 'Image generation failed');
    } finally {
      setImageLoading(false);
    }
  };

  const submitSpeech = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSpeechLoading(true);
    setSpeechError(null);

    try {
      const result = await postJson<SpeechResponse>('/api/generate-speech', {
        text: speechText,
        voice: speechVoice,
      });
      setSpeechResult(result);
    } catch (error) {
      setSpeechResult(null);
      setSpeechError(error instanceof Error ? error.message : 'Speech generation failed');
    } finally {
      setSpeechLoading(false);
    }
  };

  const submitTranscription = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTranscriptionLoading(true);
    setTranscriptionError(null);

    try {
      if (!audioFile) {
        throw new Error('Choose an audio file first');
      }

      const formData = new FormData();
      formData.set('audio', audioFile);

      const result = await postFormData<TranscriptionResponse>('/api/transcribe', formData);
      setTranscriptionResult(result);
    } catch (error) {
      setTranscriptionResult(null);
      setTranscriptionError(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setTranscriptionLoading(false);
    }
  };

  const submitVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVideoLoading(true);
    setVideoError(null);

    try {
      const result = await postJson<VideoResponse>('/api/generate-video', { prompt: videoPrompt });
      setVideoResult(result);
    } catch (error) {
      setVideoResult(null);
      setVideoError(error instanceof Error ? error.message : 'Video generation failed');
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Internal playground</p>
        <h1>OpenRouter-first multimodal scaffold</h1>
        <p className="lede">
          The app exposes one form per modality and renders normalized responses for text,
          structured JSON, image, speech, transcription, and video. Text and image route through
          OpenRouter, while audio and video use explicit fallback providers behind the same helper
          boundary.
        </p>
      </section>

      <div className="grid">
        <Panel title="Text generation">
          <form onSubmit={submitText} className="stack">
            <label>
              Prompt
              <textarea value={textPrompt} onChange={(event) => setTextPrompt(event.target.value)} rows={5} />
            </label>
            <button type="submit" disabled={textLoading}>
              {textLoading ? 'Generating…' : 'Generate text'}
            </button>
          </form>
          {textError ? <p className="error">{textError}</p> : null}
          {textResult ? <pre>{JSON.stringify(textResult, null, 2)}</pre> : null}
        </Panel>

        <Panel title="Structured output">
          <form onSubmit={submitStructured} className="stack">
            <label>
              Prompt
              <textarea
                value={structuredPrompt}
                onChange={(event) => setStructuredPrompt(event.target.value)}
                rows={5}
              />
            </label>
            <button type="submit" disabled={structuredLoading}>
              {structuredLoading ? 'Generating…' : 'Generate JSON'}
            </button>
          </form>
          {structuredError ? <p className="error">{structuredError}</p> : null}
          {structuredResult ? <pre>{JSON.stringify(structuredResult, null, 2)}</pre> : null}
        </Panel>

        <Panel title="Image generation">
          <form onSubmit={submitImage} className="stack">
            <label>
              Prompt
              <textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} rows={5} />
            </label>
            <button type="submit" disabled={imageLoading}>
              {imageLoading ? 'Generating…' : 'Generate image'}
            </button>
          </form>
          {imageError ? <p className="error">{imageError}</p> : null}
          {imageResult ? (
            <div className="result-stack">
              <img src={imageResult.imageDataUrl} alt={imageResult.prompt} className="media-frame" />
              <pre>{JSON.stringify(imageResult, null, 2)}</pre>
            </div>
          ) : null}
        </Panel>

        <Panel title="Speech generation">
          <form onSubmit={submitSpeech} className="stack">
            <label>
              Text
              <textarea value={speechText} onChange={(event) => setSpeechText(event.target.value)} rows={5} />
            </label>
            <label>
              Voice
              <input value={speechVoice} onChange={(event) => setSpeechVoice(event.target.value)} />
            </label>
            <button type="submit" disabled={speechLoading}>
              {speechLoading ? 'Generating…' : 'Generate speech'}
            </button>
          </form>
          {speechError ? <p className="error">{speechError}</p> : null}
          {speechResult ? (
            <div className="result-stack">
              <audio controls src={speechResult.audioDataUrl} />
              <pre>{JSON.stringify(speechResult, null, 2)}</pre>
            </div>
          ) : null}
        </Panel>

        <Panel title="Transcription">
          <form onSubmit={submitTranscription} className="stack">
            <label>
              Audio file
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button type="submit" disabled={transcriptionLoading}>
              {transcriptionLoading ? 'Transcribing…' : 'Transcribe audio'}
            </button>
          </form>
          {transcriptionError ? <p className="error">{transcriptionError}</p> : null}
          {transcriptionResult ? (
            <div className="result-stack">
              <pre>{JSON.stringify(transcriptionResult, null, 2)}</pre>
            </div>
          ) : null}
        </Panel>

        <Panel title="Video generation">
          <form onSubmit={submitVideo} className="stack">
            <label>
              Prompt
              <textarea value={videoPrompt} onChange={(event) => setVideoPrompt(event.target.value)} rows={5} />
            </label>
            <button type="submit" disabled={videoLoading}>
              {videoLoading ? 'Generating…' : 'Generate video'}
            </button>
          </form>
          {videoError ? <p className="error">{videoError}</p> : null}
          {videoResult ? (
            <div className="result-stack">
              <video controls src={videoResult.videoDataUrl} className="media-frame" />
              <pre>{JSON.stringify(videoResult, null, 2)}</pre>
            </div>
          ) : null}
        </Panel>
      </div>
    </main>
  );
}
