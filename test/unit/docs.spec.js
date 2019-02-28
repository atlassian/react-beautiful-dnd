// @flow
import globby from 'globby';
import invariant from 'tiny-invariant';
import fs from 'fs-extra';

it('should end all nested docs with a link back to the documentation root', async () => {
  const files: string[] = await globby('docs/**/*.md', { absolute: true });
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const contents: string = await fs.readFile(file, 'utf8');
    const backLink: 'string' =
      '[← Back to documentation](/README.md#documentation-)\n';
    expect(contents.endsWith(backLink)).toBe(true);
  }
});

it('should use correct wording', async () => {
  const files: string[] = await globby(['**/*.md', '!node_modules/'], {
    absolute: true,
  });
  expect(files.length).toBeGreaterThan(0);

  const draggable: string = '<Draggable />';
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
