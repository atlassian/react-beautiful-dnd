// @flow
import globby from 'globby';
import invariant from 'tiny-invariant';

const convention: RegExp = /^[a-z0-9\-\.\/]+$/;
const isSnakeCase = (filePath: string): boolean => convention.test(filePath);

it('should have every source file following the file name convention', async () => {
  console.log('running');
  const src = await globby('src/**/*');
  const website = await globby('website/src/**/*');
  const examples = await invariant(src.length, 'Could not find source files');
  invariant(website.length, 'Could not find website source files');

  [...src, ...website].forEach((filePath: string) => {
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
