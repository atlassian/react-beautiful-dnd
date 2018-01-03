// @flow
import { subtract } from '../position';
import { offset } from '../spacing';
import isPartiallyVisible from '../visibility/is-partially-visible';
import type {
  Area,
  DraggableDimension,
  DroppableDimension,
  Position,
  Spacing,
} from '../../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  newCenter: Position,
  viewport: Area,
|}

export default ({
  draggable,
  destination,
  newCenter,
  viewport,
}: Args): boolean => {
  const diff: Position = subtract(newCenter, draggable.page.withMargin.center);
  const shifted: Spacing = offset(draggable.page.withMargin, diff);

  return isPartiallyVisible({
    target: shifted,
    destination,
    viewport,
  });
};
