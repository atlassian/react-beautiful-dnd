// @flow
import isWithin from '../is-within';
import type {
  ClientRect,
  Spacing,
} from '../../types';

export default (container: ClientRect | Spacing) => {
  const isWithinVertical = isWithin(container.top, container.bottom);
  const isWithinHorizontal = isWithin(container.left, container.right);

  return (target: ClientRect | Spacing): boolean => {
    const isPartiallyVisibleVertically: boolean =
      isWithinVertical(target.top) || isWithinVertical(target.bottom);
    const isPartiallyVisibleHorizontally: boolean =
      isWithinHorizontal(target.left) || isWithinHorizontal(target.right);

    // Needs to be partially visible both vertically and horizontally to
    // be actually visible by the user.
    return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
  };
};
