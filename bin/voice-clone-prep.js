#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { analyzeWav, checkForOneSentenceClone } from '../src/index.js';

const file = process.argv[2];
if (!file) {
  console.log('Usage: voice-clone-prep <recording.wav>\nChecks a recording against one-sentence voice-clone requirements.');
  process.exit(1);
}
const stats = analyzeWav(await readFile(file));
const result = checkForOneSentenceClone(stats);
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
