import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Page from './page';

describe('Page', () => {
  it('renders all modality sections', () => {
    const html = renderToStaticMarkup(<Page />);

    expect(html).toContain('Text generation');
    expect(html).toContain('Structured output');
    expect(html).toContain('Image generation');
    expect(html).toContain('Speech generation');
    expect(html).toContain('Transcription');
    expect(html).toContain('Video generation');
    expect(html).toContain('Generate text');
    expect(html).toContain('Generate JSON');
    expect(html).toContain('Generate image');
    expect(html).toContain('Generate speech');
    expect(html).toContain('Transcribe audio');
    expect(html).toContain('Generate video');
  });
});
