// @flow
import isWithin from '../is-within';
import type {
  Spacing,
  Position,
} from '../../types';

export const isSpacingPartiallyWithin = (container: Spacing) => {
  const isWithinVertical = isWithin(container.top, container.bottom);
  const isWithinHorizontal = isWithin(container.left, container.right);

  return (target: Spacing): boolean => {
    const isPartiallyVisibleVertically: boolean =
      isWithinVertical(target.top) || isWithinVertical(target.bottom);
    const isPartiallyVisibleHorizontally: boolean =
      isWithinHorizontal(target.left) || isWithinHorizontal(target.right);

    // Needs to be partially visible both vertically and horizontally to
    // be actually visible by the user.
    return isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;
  };
};

export const isPositionPartiallyWithin = (container: Spacing) => {
  const isWithinVertical = isWithin(container.top, container.bottom);
  const isWithinHorizontal = isWithin(container.left, container.right);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};

