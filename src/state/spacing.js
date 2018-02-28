// @flow
import type {
  Position,
  Spacing,
} from '../types';

export const offsetByPosition = (spacing: Spacing, point: Position): Spacing => ({
  top: spacing.top + point.y,
  left: spacing.left + point.x,
  bottom: spacing.bottom + point.y,
  right: spacing.right + point.x,
});

export const expandByPosition = (spacing: Spacing, position: Position): Spacing => ({
  // pulling back to increase size
  top: spacing.top - position.y,
  left: spacing.left - position.x,
  // pushing forward to increase size
  right: spacing.right + position.x,
  bottom: spacing.bottom + position.y,
});

export const expandBySpacing = (spacing1: Spacing, spacing2: Spacing): Spacing => ({
  // pulling back to increase size
  top: spacing1.top - spacing2.top,
  left: spacing1.left - spacing2.left,
  // pushing forward to increase size
  bottom: spacing1.bottom + spacing2.bottom,
  right: spacing1.right + spacing2.right,
});

export const shrinkBySpacing = (spacing1: Spacing, spacing2: Spacing): Spacing => ({
  // pushing forward to descrease size
  top: spacing1.top + spacing2.top,
  left: spacing1.left + spacing2.left,
  // pulling backwards to descrease size
  bottom: spacing1.bottom - spacing2.bottom,
  right: spacing1.right - spacing2.right,
});

export const isEqual = (spacing1: Spacing, spacing2: Spacing): boolean => (
  spacing1.top === spacing2.top &&
  spacing1.right === spacing2.right &&
  spacing1.bottom === spacing2.bottom &&
  spacing1.left === spacing2.left
);

export const getCorners = (spacing: Spacing): Position[] => [
  { x: spacing.left, y: spacing.top },
  { x: spacing.right, y: spacing.top },
  { x: spacing.left, y: spacing.bottom },
  { x: spacing.right, y: spacing.bottom },
];
