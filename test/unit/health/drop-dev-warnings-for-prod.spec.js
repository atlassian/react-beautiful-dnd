// @flow
/**
 * @jest-environment node
 */
import child from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const exec = promisify(child.exec);
const readFile = promisify(fs.readFile);

// 120 second timeout
jest.setTimeout(120 * 1000);

async function clean() {
  await exec('yarn build:clean');
}

beforeAll(async () => {
  await clean();
  await exec('yarn build');
});

afterAll(clean);

it('should contain warnings in development', async () => {
  const filePath: string = './dist/react-beautiful-dnd.js';
  const contents: string = await readFile(filePath, 'utf-8');

  expect(contents.includes('This is a development only message')).toBe(true);
});

it('should not contain warnings in production', async () => {
  const filePath: string = './dist/react-beautiful-dnd.min.js';
  const contents: string = await readFile(filePath, 'utf-8');

  expect(contents.includes('This is a development only message')).toBe(false);

  // Checking there are no console.* messages
  // Using regex so we can get really nice error messages

  // https://regexr.com/40pno
  // .*? is a lazy match - will grab as little as possible
  const regex: RegExp = /console\.\w+\(.*?\)/g;

  const matches: ?(string[]) = contents.match(regex);
  expect(matches).toEqual(null);
});
