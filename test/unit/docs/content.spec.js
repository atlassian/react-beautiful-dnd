// @flow
import globby from 'globby';
/* $FlowFixMe: flow is saying there is no default export from fs-extra */
import fs from 'fs-extra';
// Disabling eslint design to prevent using regeneratorRuntime in distributions
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

it('should end all nested docs with a link back to the documentation root', async () => {
  const files: string[] = await globby('docs/**/*.md');
  expect(files.length).toBeGreaterThan(0);
  const backLink: string =
    '[← Back to documentation](/README.md#documentation-)\n';

  for (const file of files) {
    const contents: string = await fs.readFile(file, 'utf8');
    expect(contents.endsWith(backLink)).toBe(true);
  }
});

it('should use correct wording', async () => {
  const files: string[] = await globby(['**/*.md', '!node_modules/']);
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
