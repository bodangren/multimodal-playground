"use client";

import { useState } from 'react';
import type { FormEvent } from 'react';
import type { StructuredSchemaName } from '@/lib/schemas/product';

type TextResponse = {
  text: string;
  modelId: string;
  responseId: string;
};

type StructuredResponse = {
  schema: StructuredSchemaName;
  data: Record<string, unknown>;
  text: string;
  modelId: string;
  responseId: string;
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

export default function Page() {
  const [textPrompt, setTextPrompt] = useState('Write a short product tagline for an AI playground.');
  const [textResult, setTextResult] = useState<TextResponse | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  const [structuredPrompt, setStructuredPrompt] = useState('Create a concise product summary for a creative AI assistant.');
  const [structuredResult, setStructuredResult] = useState<StructuredResponse | null>(null);
  const [structuredError, setStructuredError] = useState<string | null>(null);
  const [structuredLoading, setStructuredLoading] = useState(false);

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

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Internal playground</p>
        <h1>OpenRouter-first multimodal scaffold</h1>
        <p className="lede">
          Phase 1 is wired for text generation and structured output with centralized provider
          initialization, Zod schemas, and normalized route errors.
        </p>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Text generation</h2>
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
        </section>

        <section className="card">
          <h2>Structured output</h2>
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
        </section>
      </div>
    </main>
  );
}
