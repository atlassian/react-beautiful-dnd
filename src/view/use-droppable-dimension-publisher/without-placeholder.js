// @flow
import type { DroppableDimension } from '../../types';

export default function withoutPlaceholder(
  placeholder: ?HTMLElement,
  fn: () => DroppableDimension,
): DroppableDimension {
  if (!placeholder) {
    return fn();
  }

  const last: string = placeholder.style.display;
  placeholder.style.display = 'none';
  const result: DroppableDimension = fn();
  placeholder.style.display = last;

  return result;
}
