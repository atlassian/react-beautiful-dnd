// @flow
import type { Spacing } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const toInline = (spacing: Spacing): string => {
  const { top, right, bottom, left } = spacing;
  return `${top}px ${right}px ${bottom}px ${left}px`;
};

