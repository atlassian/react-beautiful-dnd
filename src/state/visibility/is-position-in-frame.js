// @flow
import isWithin from '../is-within';
import type {
  Spacing,
  Position,
} from '../../types';

export default (frame: Spacing) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return (point: Position) =>
    isWithinVertical(point.y) &&
    isWithinVertical(point.y) &&
    isWithinHorizontal(point.x) &&
    isWithinHorizontal(point.x);
};

