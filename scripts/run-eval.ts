#!/usr/bin/env node
import { readFileSync } from 'fs';
import { validateFixtures, runHarness, formatHarnessResult } from '../src/lib/eval';

const fixturesPath = process.argv[2] || 'fixtures/eval-fixtures.json';

console.log(`Loading fixtures from: ${fixturesPath}`);

const fixturesData = JSON.parse(readFileSync(fixturesPath, 'utf-8'));
const fixtures = validateFixtures(fixturesData);

console.log(`Loaded ${fixtures.length} fixture(s)`);
console.log('');

const result = await runHarness(fixtures);
console.log(formatHarnessResult(result));

process.exit(result.failed > 0 ? 1 : 0);