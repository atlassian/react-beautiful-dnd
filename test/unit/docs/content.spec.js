// @flow
import globby from 'globby';
import * as fs from 'fs-extra';
// Disabling eslint design to prevent using regeneratorRuntime in distributions
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

it('should end all nested docs with a link back to the documentation root', async () => {
  const files: string[] = await globby('docs/**/*.md');
  expect(files.length).toBeGreaterThan(0);
  const backLink: string =
    '[← Back to documentation](/README.md#documentation-)';

  for (const file of files) {
    const contents: string = await fs.readFile(file, 'utf8');

    // Printing a nice message to allow for quick fixing
    const endsWithBacklink: boolean = contents.trim().endsWith(backLink);

    if (!endsWithBacklink) {
      expect(`
        File: "${file}"
        Did not end with back link
      `).toBe(true);
    }

    // need at least one assertion
    expect(true).toBe(true);
  }
});

it('should use correct wording', async () => {
  const files: string[] = await globby([
    '**/*.md',
    '!node_modules/',
    '!CHANGELOG.md',
  ]);
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const contents: string = await fs.readFile(file, 'utf8');

    // Expected: <Draggable />, <Droppable />, `<DragDropContext />`
    expect(contents.includes('`Draggable`')).toBe(false);
    expect(contents.includes('`Droppable`')).toBe(false);
    expect(contents.includes('`DragDropContext`')).toBe(false);

    // not enough whitespace
    expect(contents.includes('`<Draggable/>`')).toBe(false);
    expect(contents.includes('`<Droppable/>`')).toBe(false);
    expect(contents.includes('`<DragDropContext/>`')).toBe(false);

    // not a self closing tag
    expect(contents.includes('`<Draggable>`')).toBe(false);
    expect(contents.includes('`<Droppable>`')).toBe(false);
    expect(contents.includes('`<DragDropContext>`')).toBe(false);
  }
});
