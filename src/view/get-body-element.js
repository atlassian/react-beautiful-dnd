// @flow
import { invariant } from '../invariant';

export default (): HTMLBodyElement => {
  const body: ?HTMLBodyElement = document.body;
  invariant(body, 'Cannot find document.body');
  return body;
};
