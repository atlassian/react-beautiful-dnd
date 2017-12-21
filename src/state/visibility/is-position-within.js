// @flow
import isWithin from '../is-within';
import type {
  Spacing,
  Position,
} from '../../types';

export default (container: Spacing) => {
  const isWithinVertical = isWithin(container.top, container.bottom);
  const isWithinHorizontal = isWithin(container.left, container.right);

  return (point: Position): boolean => (
    isWithinHorizontal(point.x) &&
    isWithinVertical(point.y)
  );
};
