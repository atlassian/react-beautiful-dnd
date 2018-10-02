// @flow
import React from 'react';
import invariant from 'tiny-invariant';

const noop = () => {};

const warn = () => {
  if (process.env.NODE_ENV === 'production') {
    return noop;
  }

  const hasWarned: boolean = false;

  return () => {
    if (hasWarned) {
      return;
    }
    const version: string = React.version;
    const minor: string = version.split('.')[1];
    invariant(minor, 'Unable to parse React version');

    const value: number = Number(minor);
    // we can use isNaN directly, because at this point the value is either
    // a number or NaN
    // eslint-disable-next-line no-restricted-globals
    invariant(!isNaN(minor), 'Unable to parse React version');

    const shouldWarn: boolean = value >= 5;

    if (!shouldWarn) {
      return;
    }

    console.warn('LOLZ');
  };
};

export default warn;
