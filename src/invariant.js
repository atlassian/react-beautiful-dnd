// @flow
const isProduction: boolean = process.env.NODE_ENV === 'production';
const prefix: string = 'Invariant failed';

export class RbdInvariant extends Error {}

// A copy-paste of tiny-invariant but with a custom error type
// Throw an error if the condition fails
export function invariant(condition: mixed, message?: string) {
  if (condition) {
    return;
  }

  if (isProduction) {
    // In production we strip the message but still throw
    throw new Error(prefix);
  } else {
    // When not in production we allow the message to pass through
    // *This block will be removed in production builds*
    throw new Error(`${prefix}: ${message || ''}`);
  }
}
