// @flow
/* eslint-disable no-console */
export function log(...args: mixed[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

export function warn(...args: mixed[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
}

export function error(...args: mixed[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
}

export function group(title: string = '') {
  if (process.env.NODE_ENV !== 'production') {
    console.group(title);
  }
}

export function groupEnd() {
  if (process.env.NODE_ENV !== 'production') {
    console.groupEnd();
  }
}
