// @flow
import globby from 'globby';
import invariant from 'tiny-invariant';
import pkg from '../../../package.json';

// Regex playground: https://regexr.com/40fin
const convention: RegExp = /^[a-z0-9\-_./]+$/;
const isSnakeCase = (filePath: string): boolean => convention.test(filePath);

const exceptions: string[] = [
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'ISSUE_TEMPLATE.md',
  'README.md',
];

it('should have every prettier target following the file name convention', async () => {
  const targets: string[] = pkg.config.prettier_target.split(' ');
  const paths: string[] = await globby(targets);

  invariant(
    paths.length,
    'Could not find files to test against file name convention',
  );

  paths.forEach((filePath: string) => {
    if (exceptions.includes(filePath)) {
      return;
    }

    const isMatching: boolean = isSnakeCase(filePath);

    invariant(
      isMatching,
      `${filePath} does not follow the file path convention (snake-case.js) ${convention.toString()}`,
    );

    expect(isMatching).toBe(true);
  });
});
