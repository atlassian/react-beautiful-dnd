// @flow
import invariant from 'tiny-invariant';

export default (): HTMLBodyElement => {
  const body: ?HTMLBodyElement = document.body;
  invariant(body, 'Cannot find document.body');
  return body;
};
