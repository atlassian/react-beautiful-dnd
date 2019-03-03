// @flow
import globby from 'globby';
import fs from 'fs-extra';
import getProcessor from 'markdown-it';
// Disabling eslint design to prevent using regeneratorRuntime in distributions
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */

const markdown = getProcessor();

type Token = {|
  type: string,
  attrs: [string[]],
  children?: Token[],
|};

const getPath = (file: string): string => {
  if (file.startsWith('/')) {
    return file;
  }
  return `/${file}`;
};

const validate = (token: Token, currentFile: string, files: string[]) => {
  const href: string = token.attrs[0][1];
  // don't care about external links
  if (href.startsWith('http')) {
    return;
  }
  const withoutFragment: string = href.split('#')[0];

  // linking within a file - not checking for now
  if (!withoutFragment) {
    return;
  }

  // ignoring stories links
  if (withoutFragment.startsWith('/stories')) {
    return;
  }

  const isValid: boolean = files.some(
    (filePath: string): boolean => withoutFragment === getPath(filePath),
  );

  if (isValid) {
    return;
  }

  expect(false).toBe(
    `dead link: ${withoutFragment}
      in file: ${currentFile}`,
  );
};

const parse = (token: Token, file: string, files: string[]) => {
  if (token.type === 'link_open') {
    validate(token, file, files);
    // check(token.attr);
  }
  if (token.children) {
    token.children.forEach((child: Token) => parse(child, file, files));
  }
};

it('should use have no dead links', async () => {
  const files: string[] = await globby(['**/*.md', '!node_modules/']);
  expect(files.length).toBeGreaterThan(0);

  for (const file of files) {
    const contents: string = await fs.readFile(file, 'utf8');

    const tokens = markdown.parse(contents, {});
    tokens.forEach(token => parse(token, file, files));
  }

  // need at least one assertion
  expect(true).toBe(true);
});
