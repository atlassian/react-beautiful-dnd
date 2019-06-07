// @flow
/*
 * Utility file for keeping track of errors we have already logged
 * to eliminate duplication of logging due to the window listener on the error event.
 */
const errorMap = {};

export const hasLoggedError = (key: string): number => errorMap[key];

export const setError = (key: string): void => {
  errorMap[key] = 1;
};

export const clearErrorMap = (): void => {
  const props = Object.keys(errorMap);
  for (let i = 0; i < props.length; i++) {
    delete errorMap[props[i]];
  }
};
