// @flow
import globby from 'globby';
import invariant from 'tiny-invariant';

// Regex playground: https://regexr.com/40fin
const convention: RegExp = /^[a-z0-9\-_./]+$/;
const isSnakeCase = (filePath: string): boolean => convention.test(filePath);

it('should have every source file following the file name convention', async () => {
  const src = await globby('src/**/*');
  const docs = await globby('docs/**/*');
  const test = await globby('test/**/*');
  const website = await globby([
    'website/src/**/*',
    // TODO: fix
    // 'website/documentation/**/*',
  ]);

  invariant(src.length, 'Could not find /src files');
  invariant(docs.length, 'Could not find /docs files');
  invariant(test.length, 'Could not find /test/src files');
  invariant(website.length, 'Could not find /website/src files');

  [...src, ...test, ...website, ...docs].forEach((filePath: string) => {
    const isMatching: boolean = isSnakeCase(filePath);

    if (!isMatching) {
      console.warn(
        filePath,
        'does not follow the file path convention (snake-case.js)',
        convention,
      );
    }

    expect(isMatching).toBe(true);
  });
});
