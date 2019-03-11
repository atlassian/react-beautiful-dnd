// @flow
import globby from 'globby';
import * as fs from 'fs-extra';
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

// adding a forward slash to start of path
const withLeadingSlash = (file: string): string => {
  if (file.startsWith('/')) {
    return file;
  }
  return `/${file}`;
};

const validate = (token: Token, currentFile: string, files: string[]) => {
  const href: string = token.attrs[0][1];
  // Not validating external links
  if (href.startsWith('http')) {
    return;
  }

  // not checking links within a file for now
  if (href.startsWith('#')) {
    return;
  }

  // not checking links to stories for now
  if (href.startsWith('/stories')) {
    return;
  }

  const withoutFragment: string = href.split('#')[0];

  const isValid: boolean = files.some(
    (filePath: string): boolean =>
      withoutFragment === withLeadingSlash(filePath),
  );

  if (isValid) {
    return;
  }

  const message: string = `
    Dead link: ${withoutFragment}
    Found in:  ${withLeadingSlash(currentFile)}
  `;

  expect(false).toBe(message);
};

const parse = (token: Token, file: string, files: string[]) => {
  if (token.type === 'link_open') {
    validate(token, file, files);
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

    const tokens: Token[] = markdown.parse(contents, {});
    expect(tokens.length).toBeGreaterThan(0);
    tokens.forEach((token: Token) => parse(token, file, files));
  }

  // need at least one assertion
  expect(true).toBe(true);
});
