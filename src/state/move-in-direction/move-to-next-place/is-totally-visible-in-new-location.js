// @flow
import { type Position, type Rect, type Spacing } from 'css-box-model';
import { subtract } from '../../position';
import { offsetByPosition } from '../../spacing';
import {
  isTotallyVisible,
  isTotallyVisibleOnAxis,
  type Args as IsVisibleArgs,
} from '../../visibility/is-visible';
import type { DraggableDimension, DroppableDimension } from '../../../types';

type Args = {|
  draggable: DraggableDimension,
  destination: DroppableDimension,
  newPageBorderBoxCenter: Position,
  viewport: Rect,
  // only allowing a 'false' value. Being super clear
  withDroppableDisplacement: false,
  onlyOnMainAxis?: boolean,
|};

export default ({
  draggable,
  destination,
  newPageBorderBoxCenter,
  viewport,
  withDroppableDisplacement,
  onlyOnMainAxis = false,
}: Args): boolean => {
  // What would the location of the Draggable be once the move is completed?
  // We are not considering margins for this calculation.
  // This is because a move might move a Draggable slightly outside of the bounds
  // of a Droppable (which is okay)
  const changeNeeded: Position = subtract(
    newPageBorderBoxCenter,
    draggable.page.borderBox.center,
  );
  const shifted: Spacing = offsetByPosition(
    draggable.page.borderBox,
    changeNeeded,
  );

  // Must be totally visible, not just partially visible.
  const args: IsVisibleArgs = {
    target: shifted,
    destination,
    withDroppableDisplacement,
    viewport,
  };

  return onlyOnMainAxis ? isTotallyVisibleOnAxis(args) : isTotallyVisible(args);
};
