// @flow
import { invariant } from '../invariant';

export default (): HTMLElement => {
  const doc: ?HTMLElement = document.documentElement;
  invariant(doc, 'Cannot find document.documentElement');
  return doc;
};
