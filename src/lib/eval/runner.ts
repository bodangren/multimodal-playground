import { Fixture, Assertion } from './fixtures';
import { generateTextFromPrompt } from '@/lib/generate-text';
import { generateImageFromPrompt } from '@/lib/generate-image';

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  message: string;
}

export interface FixtureResult {
  fixtureId: string;
  passed: boolean;
  assertions: AssertionResult[];
  error?: string;
  durationMs: number;
}

export interface HarnessResult {
  total: number;
  passed: number;
  failed: number;
  results: FixtureResult[];
  durationMs: number;
}

function parseLengthRange(value: string): { min: number; max: number } | null {
  const match = value.match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
}

export function evaluateAssertion(assertion: Assertion, output: string): AssertionResult {
  switch (assertion.type) {
    case 'contains':
      return {
        assertion,
        passed: output.toLowerCase().includes(assertion.value.toLowerCase()),
        message: assertion.description ?? `Output should contain "${assertion.value}"`,
      };
    case 'notContains':
      return {
        assertion,
        passed: !output.toLowerCase().includes(assertion.value.toLowerCase()),
        message: assertion.description ?? `Output should not contain "${assertion.value}"`,
      };
    case 'regex':
      try {
        const regex = new RegExp(assertion.value, 'i');
        return {
          assertion,
          passed: regex.test(output),
          message: assertion.description ?? `Output should match regex "${assertion.value}"`,
        };
      } catch {
        return {
          assertion,
          passed: false,
          message: `Invalid regex pattern: ${assertion.value}`,
        };
      }
    case 'length': {
        const range = parseLengthRange(assertion.value);
        if (!range) {
          return {
            assertion,
            passed: false,
            message: `Invalid length range format: ${assertion.value}`,
          };
        }
        return {
          assertion,
          passed: output.length >= range.min && output.length <= range.max,
          message: assertion.description ?? `Output length should be between ${range.min} and ${range.max}`,
        };
      }
    case 'custom':
      return {
        assertion,
        passed: false,
        message: 'Custom assertions not yet implemented',
      };
    default:
      return {
        assertion,
        passed: false,
        message: `Unknown assertion type: ${assertion.type}`,
      };
  }
}

async function executeTextFixture(fixture: Fixture): Promise<{ output: string; modelId: string }> {
  const result = await generateTextFromPrompt(fixture.input);
  return { output: result.text, modelId: result.modelId };
}

async function executeImageFixture(fixture: Fixture): Promise<{ output: string; modelId: string }> {
  const result = await generateImageFromPrompt(fixture.input);
  return { output: result.imageDataUrl, modelId: result.modelId };
}

export async function runFixture(fixture: Fixture): Promise<FixtureResult> {
  const startTime = Date.now();

  try {
    let output: string;

    if (fixture.modality === 'text') {
      ({ output } = await executeTextFixture(fixture));
    } else if (fixture.modality === 'image') {
      ({ output } = await executeImageFixture(fixture));
    } else {
      throw new Error(`Unsupported modality: ${fixture.modality}`);
    }

    const assertions = fixture.assertions.map(a => evaluateAssertion(a, output));
    const passed = assertions.every(a => a.passed);

    return {
      fixtureId: fixture.id,
      passed,
      assertions,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      fixtureId: fixture.id,
      passed: false,
      assertions: [],
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    };
  }
}

export async function runHarness(fixtures: Fixture[]): Promise<HarnessResult> {
  const startTime = Date.now();
  const enabledFixtures = fixtures.filter(f => f.enabled !== false);

  const results: FixtureResult[] = [];
  for (const fixture of enabledFixtures) {
    results.push(await runFixture(fixture));
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    total: enabledFixtures.length,
    passed,
    failed,
    results,
    durationMs: Date.now() - startTime,
  };
}

export function formatHarnessResult(result: HarnessResult): string {
  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push('EVALUATION HARNESS RESULTS');
  lines.push('='.repeat(60));
  lines.push(`Total:  ${result.total}`);
  lines.push(`Passed: ${result.passed} ✓`);
  lines.push(`Failed: ${result.failed} ✗`);
  lines.push(`Duration: ${result.durationMs}ms`);
  lines.push('='.repeat(60));

  for (const fixtureResult of result.results) {
    lines.push('');
    lines.push(`[${fixtureResult.passed ? 'PASS' : 'FAIL'}] ${fixtureResult.fixtureId}`);
    if (fixtureResult.error) {
      lines.push(`  Error: ${fixtureResult.error}`);
    }
    for (const assertion of fixtureResult.assertions) {
      const icon = assertion.passed ? '✓' : '✗';
      lines.push(`  ${icon} ${assertion.message}`);
      if (!assertion.passed) {
        lines.push(`    Expected: ${assertion.assertion.value}`);
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push(result.failed === 0 ? 'ALL TESTS PASSED' : `${result.failed} TEST(S) FAILED`);
  lines.push('='.repeat(60));

  return lines.join('\n');
}