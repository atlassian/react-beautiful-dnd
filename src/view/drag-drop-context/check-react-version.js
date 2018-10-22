// @flow
import invariant from 'tiny-invariant';

import { warning } from '../../debug/dev-warning';

type Version = {|
  major: number,
  minor: number,
  patch: number,
  raw: string,
|};

// known performance issue with dev tools
// https://github.com/atlassian/react-beautiful-dnd/issues/808
const issueWithDevTools: Version = {
  major: 16,
  minor: 5,
  patch: 0,
  raw: `^16.5.0`,
};

// We can use a simple regex here given that:
// - the version that react supplies is always full: eg 16.5.2
// - our peer dependency version is to a full version (eg ^16.3.1)
const semver: RegExp = /(\d+)\.(\d+)\.(\d+)$/;
const getVersion = (value: string): Version => {
  const result: ?(string[]) = semver.exec(value);

  invariant(result != null, `Unable to parse React version ${value}`);

  const major: number = Number(result[1]);
  const minor: number = Number(result[2]);
  const patch: number = Number(result[3]);

  return {
    major,
    minor,
    patch,
    raw: value,
  };
};

const isSatisfied = (expected: Version, actual: Version): boolean => {
  if (actual.major > expected.major) {
    return true;
  }

  if (actual.major < expected.major) {
    return false;
  }

  // major is equal, continue on

  if (actual.minor > expected.minor) {
    return true;
  }

  if (actual.minor < expected.minor) {
    return false;
  }

  // minor is equal, continue on

  return actual.patch >= expected.patch;
};

export default (peerDepValue: string, actualValue: string) => {
  const peerDep: Version = getVersion(peerDepValue);
  const actual: Version = getVersion(actualValue);

  if (!isSatisfied(peerDep, actual)) {
    warning(`
      React version: [${actual.raw}]
      does not satisfy expected peer dependency version: [${peerDep.raw}]

      This can result in run time bugs, and even fatal crashes
    `);
  }

  if (isSatisfied(issueWithDevTools, actual)) {
    warning(`
      Provided React version: ${actual.raw} has a known
      dev only performance issue with when dev tools

      More information: https://github.com/atlassian/react-beautiful-dnd/issues/808
    `);
  }
};
