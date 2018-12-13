// @flow
import invariant from 'tiny-invariant';
import type { Placeholder } from '../../../types';
import { prefix } from '../../data-attributes';
import createStyleElement from '../create-style-element';
import getHead from '../get-head';
import getPlaceholderAnimation from './get-placeholder-animation';

export type AnimationMarshal = {|
  mount: () => void,
  onDragStart: (placeholder: Placeholder) => void,
  onDragEnd: () => void,
  unmount: () => void,
|};

export default (styleContext: string): AnimationMarshal => {
  let el: ?HTMLStyleElement = null;

  const mount = () => {
    invariant(!el, 'Already mounted');
    el = createStyleElement();
    el.setAttribute(`${prefix}-animation`, styleContext);

    // add style tags to head
    getHead().appendChild(el);
  };

  const setContent = (value: string) => {
    invariant(el, 'Expected a mounted element');
    el.innerHTML = value;
  };

  const onDragStart = (placeholder: Placeholder) => {
    setContent(getPlaceholderAnimation(styleContext, placeholder));
  };

  const onDragEnd = () => {
    setContent('');
  };

  const unmount = (): void => {
    invariant(el, 'Cannot unmount node as it is already unmounted');

    // Remove from head
    getHead().removeChild(el);
    // Unset for cleanup
    el = null;
  };

  const marshal: AnimationMarshal = {
    mount,
    onDragStart,
    onDragEnd,
    unmount,
  };

  return marshal;
};
