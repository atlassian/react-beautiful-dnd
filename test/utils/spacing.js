// @flow
import type { Spacing } from 'css-box-model';

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
