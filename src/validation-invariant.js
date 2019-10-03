// @flow
import { invariant } from './invariant';
import { warning } from './dev-warning';

let last: ?number = null;

export function validationInvariant(condition: mixed, message: string) {
  if (condition) {
    return;
  }

  const current: number = Date.now();
  if (last != null && current - last < 100) {
    warning(`
      Invariant failed.
      Not throwing error to prevent infinite loop.

      Message: > ${message}
    `);
    return;
  }
  last = current;
  invariant(condition, message);
}
