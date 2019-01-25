// @flow
import invariant from 'tiny-invariant';

export default (): HTMLElement => {
  const doc: ?HTMLElement = document.documentElement;
  invariant(doc, 'Cannot find document.documentElement');
  return doc;
};
