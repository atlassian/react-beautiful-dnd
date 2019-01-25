// @flow
import invariant from 'tiny-invariant';

export default (): HTMLDocument => {
  const doc: ?HTMLDocument = document.documentElement;
  invariant(doc, 'Cannot find document.documentElement');
  return doc;
};
