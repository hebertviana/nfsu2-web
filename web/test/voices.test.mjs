// The voices, settings.ini voices = dubbed | original (runtime/fileio.c, web/src/host/datacache.ts):
//   node --test web/test/voices.test.mjs
// - what the preload fetches and counts: a language pack's speech only with the dubbed voices
// - which movies count as this language's: the pack's, or with the original voices the folder's, AV1 copies included
// The modules are bundled from web/src with esbuild, as web/test/songs.test.mjs does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entry = `export * from './web/src/host/datacache.ts';`;
const js = (await esbuild.build({ stdin: { contents: entry, resolveDir: ROOT, loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'neutral' })).outputFiles[0].text;
const D = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

const files = ['speech/UG2_Speech.big', 'speech/UG2_Speech.idx', 'MOVIES/Scene01.vp6', 'MOVIES/AV1/Scene01.vp6', 'MOVIES/PSA.vp6', 'LANGUAGES/English.bin',
  'LANGPACKS/portuguese/LANGUAGES/English.bin', 'LANGPACKS/portuguese/speech/UG2_Speech.big', 'LANGPACKS/portuguese/speech/UG2_Speech.idx', 'LANGPACKS/portuguese/MOVIES/Scene01.vp6',
  'LANGPACKS/french/speech/UG2_Speech_FR.big'].map(p => ({ path: p, size: 10, mtime: 1 }));
const ps = (l) => l.map(x => x.path).sort();
const packs = (voices) => ({ texpack: '', songs: '', voices });

test('the files the preload fetches with the dubbed and the original voices', () => {
  const dubbed = ['LANGPACKS/portuguese/LANGUAGES/English.bin', 'LANGPACKS/portuguese/speech/UG2_Speech.big', 'LANGPACKS/portuguese/speech/UG2_Speech.idx'];
  assert.deepEqual(ps(D.aheadFiles(files, 'portuguese', packs('dubbed'))), dubbed);
  assert.deepEqual(ps(D.aheadFiles(files, 'portuguese', packs(''))), dubbed, 'no setting: dubbed');
  assert.deepEqual(ps(D.aheadFiles(files, 'portuguese', packs('original'))),
    ['LANGPACKS/portuguese/LANGUAGES/English.bin', 'speech/UG2_Speech.big', 'speech/UG2_Speech.idx'], 'the pack\'s text, the folder\'s speech');
});

test('a language whose speech bank has its own name: left out, and nothing in its place', () => {
  assert.deepEqual(ps(D.aheadFiles(files, 'french', packs('original'))), ['LANGUAGES/English.bin', 'speech/UG2_Speech.big', 'speech/UG2_Speech.idx']);
});

test('the movies this language can open', () => {
  assert.deepEqual(ps(D.languageMovies(files, 'portuguese', false, 'dubbed')), ['LANGPACKS/portuguese/MOVIES/Scene01.vp6', 'MOVIES/PSA.vp6']);
  assert.deepEqual(ps(D.languageMovies(files, 'portuguese', false, 'original')), ['MOVIES/PSA.vp6', 'MOVIES/Scene01.vp6']);
  assert.deepEqual(ps(D.languageMovies(files, 'portuguese', true, 'original')), ['MOVIES/AV1/Scene01.vp6', 'MOVIES/PSA.vp6'], 'the folder\'s AV1 copy again');
});
