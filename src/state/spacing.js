// @flow
import type { Spacing, Position } from 'css-box-model';

export const offsetByPosition = (
  spacing: Spacing,
  point: Position,
): Spacing => ({
  top: spacing.top + point.y,
  left: spacing.left + point.x,
  bottom: spacing.bottom + point.y,
  right: spacing.right + point.x,
});

export const expandByPosition = (
  spacing: Spacing,
  position: Position,
): Spacing => ({
  // pulling back to increase size
  top: spacing.top - position.y,
  left: spacing.left - position.x,
  // pushing forward to increase size
  right: spacing.right + position.x,
  bottom: spacing.bottom + position.y,
});

export const getCorners = (spacing: Spacing): Position[] => [
  { x: spacing.left, y: spacing.top },
  { x: spacing.right, y: spacing.top },
  { x: spacing.left, y: spacing.bottom },
  { x: spacing.right, y: spacing.bottom },
];

export const noSpacing: Spacing = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};
