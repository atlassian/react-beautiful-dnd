// @flow
import invariant from 'tiny-invariant';

export default (): HTMLElement => {
  const head: ?HTMLElement = document.head;
  invariant(head, 'Cannot find the head to append a style to');
  return head;
};
