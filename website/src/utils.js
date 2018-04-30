// @flow
const getTitleFromExamplePath = (path: string, href: string) =>
  path
    .replace(href, '')
    .replace(/\/$/, '')
    .replace(/-/g, ' ');

/* eslint-disable-next-line import/prefer-default-export */
export { getTitleFromExamplePath };
