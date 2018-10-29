// @flow
import React from 'react';
import checkReactVersion from '../../../../src/view/drag-drop-context/check-react-version';
import { peerDependencies } from '../../../../package.json';

jest.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => {
  console.warn.mockClear();
});

it('should pass if the react peer dep version is met', () => {
  const version: string = '1.3.4';

  checkReactVersion(version, version);

  expect(console.warn).not.toHaveBeenCalled();
});

it('should pass if the react peer dep version is passed', () => {
  // patch
  {
    const peerDep: string = '1.3.4';
    const actual: string = '1.3.5';

    checkReactVersion(peerDep, actual);

    expect(console.warn).not.toHaveBeenCalled();
  }
  // minor
  {
    const peerDep: string = '1.3.4';
    const actual: string = '1.4.0';

    checkReactVersion(peerDep, actual);

    expect(console.warn).not.toHaveBeenCalled();
  }
  // major
  {
    const peerDep: string = '1.3.4';
    const actual: string = '2.0.0';

    checkReactVersion(peerDep, actual);

    expect(console.warn).not.toHaveBeenCalled();
  }
});

it('should fail if the react peer dep version is not met', () => {
  // patch not met
  {
    const peerDep: string = '1.3.4';
    const actual: string = '1.3.3';

    checkReactVersion(peerDep, actual);

    expect(console.warn).toHaveBeenCalledTimes(1);
    console.warn.mockClear();
  }
  // minor not met
  {
    const peerDep: string = '1.3.4';
    const actual: string = '1.2.4';

    checkReactVersion(peerDep, actual);

    expect(console.warn).toHaveBeenCalledTimes(1);
    console.warn.mockClear();
  }
  // major not met
  {
    const peerDep: string = '1.3.4';
    const actual: string = '0.3.4';

    checkReactVersion(peerDep, actual);

    expect(console.warn).toHaveBeenCalledTimes(1);
    console.warn.mockClear();
  }
});

it('should throw if unable to parse the react version', () => {
  const peerDep: string = '1.3.4';
  const actual: string = '1.x';

  expect(() => checkReactVersion(peerDep, actual)).toThrow();
});

it('should throw if unable to parse the peer dep version', () => {
  const peerDep: string = '1.x';
  const actual: string = '1.2.3';

  expect(() => checkReactVersion(peerDep, actual)).toThrow();
});

it('should allow pre release provided versions', () => {
  const peerDep: string = '1.0.0';
  const alpha: string = '1.2.3-alpha';
  const beta: string = '1.2.3-beta';

  checkReactVersion(peerDep, alpha);
  checkReactVersion(peerDep, beta);

  expect(console.warn).not.toHaveBeenCalled();
});

// actually an integration test, but this feels like the right place for it
it('should pass on the current repo setup', () => {
  const peerDep: string = peerDependencies.react;
  const actual: string = React.version;

  checkReactVersion(peerDep, actual);

  expect(console.warn).not.toHaveBeenCalled();
});

it('should warn if the version would result in devtool slowdown', () => {
  const peerDep: string = peerDependencies.react;

  // no warnings for anything below 16.5
  checkReactVersion(peerDep, '16.4.9');
  expect(console.warn).not.toHaveBeenCalled();

  const wasCalled = () => {
    expect(console.warn).toHaveBeenCalledTimes(1);
    console.warn.mockClear();
  };

  checkReactVersion(peerDep, '16.5.0');
  wasCalled();

  checkReactVersion(peerDep, '16.5.2');
  wasCalled();

  checkReactVersion(peerDep, '16.6.0');
  wasCalled();

  checkReactVersion(peerDep, '17.0.0');
  wasCalled();
});
