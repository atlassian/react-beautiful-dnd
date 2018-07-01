// @flow
import { type Position, type Spacing } from 'css-box-model';
import isWithin from '../is-within';

export default (frame: Spacing) => {
  const isWithinVertical = isWithin(frame.top, frame.bottom);
  const isWithinHorizontal = isWithin(frame.left, frame.right);

  return (point: Position) =>
    isWithinVertical(point.y) &&
    isWithinVertical(point.y) &&
    isWithinHorizontal(point.x) &&
    isWithinHorizontal(point.x);
};
