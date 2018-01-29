// @flow
import { subtract } from '../position';
import { offset } from '../spacing';
import { isTotallyVisible, isPartiallyVisible } from '../visibility/is-visible';
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
  newPageCenter: Position,
  viewport: Area,
|}

export default ({
  draggable,
  destination,
  newPageCenter,
  viewport,
}: Args): boolean => {
  // What would the location of the Draggable be once the move is completed?
  // We are not considering margins for this calculation.
  // This is because a move might move a Draggable slightly outside of the bounds
  // of a Droppable (which is okay)
  const diff: Position = subtract(newPageCenter, draggable.page.withoutMargin.center);
  const shifted: Spacing = offset(draggable.page.withoutMargin, diff);

  // Must be totally visible, not just partially visible.

  const isVisible: boolean = isTotallyVisible({
    target: shifted,
    destination,
    viewport,
  });

  console.log('is totally visible?', isVisible);

  return isVisible;
};
