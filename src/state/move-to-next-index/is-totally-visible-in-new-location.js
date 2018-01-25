// @flow
import { subtract } from '../position';
import { offset } from '../spacing';
import { isTotallyVisible } from '../visibility/is-visible';
import isTotallyVisibleThroughFrame from '../visibility/is-totally-visible-through-frame';
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
  // what the new draggable boundary be if it had the new center
  const diff: Position = subtract(newCenter, draggable.page.withMargin.center);
  const shifted: Spacing = offset(draggable.page.withMargin, diff);

  // Must be totally visible, not just partially visible.

  const isVisible: boolean = isTotallyVisible({
    target: shifted,
    destination,
    viewport,
  });

  console.log('is totally visible?', isVisible);

  return isVisible;
};
