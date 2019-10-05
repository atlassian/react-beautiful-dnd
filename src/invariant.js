// @flow
/* eslint-disable no-restricted-syntax */
const isProduction: boolean = process.env.NODE_ENV === 'production';
const prefix: string = 'Invariant failed';

// Want to use this:
// export class RbdInvariant extends Error { }
// But it causes babel to bring in a lot of code

export function RbdInvariant(message: string) {
  this.message = message;
}
// $FlowFixMe
RbdInvariant.prototype.toString = function toString() {
  return this.message;
};

// A copy-paste of tiny-invariant but with a custom error type
// Throw an error if the condition fails
export function invariant(condition: mixed, message?: string) {
  if (condition) {
    return;
  }

  if (isProduction) {
    // In production we strip the message but still throw
    throw new RbdInvariant(prefix);
  } else {
    // When not in production we allow the message to pass through
    // *This block will be removed in production builds*
    throw new RbdInvariant(`${prefix}: ${message || ''}`);
  }
}
