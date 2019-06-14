// @flow
import type { Position, Rect, Spacing } from 'css-box-model';
import type { DraggableDimension, OnLift } from '../../../types';
import { negate, subtract } from '../../position';
import { offsetByPosition } from '../../spacing';
import didStartDisplaced from '../../did-start-after-critical';

export const getCurrentPageBorderBoxCenter = (
  draggable: DraggableDimension,
  onLift: OnLift,
): Position => {
  // If an item started displaced it is now resting
  // in a non-displaced location
  const original: Position = draggable.page.borderBox.center;
  return didStartDisplaced(draggable.descriptor.id, onLift)
    ? subtract(original, onLift.displacedBy.point)
    : original;
};

export const getCurrentPageBorderBox = (
  draggable: DraggableDimension,
  onLift: OnLift,
): Spacing => {
  // If an item started displaced it is now resting
  // in a non-displaced location
  const original: Rect = draggable.page.borderBox;

  return didStartDisplaced(draggable.descriptor.id, onLift)
    ? offsetByPosition(original, negate(onLift.displacedBy.point))
    : original;
};
