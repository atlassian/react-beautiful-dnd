// @flow
import type { Area, Axis, Position } from '../../types';

export const isTooBigToAutoScrollDroppable = (axis: Axis, frame: Area, subject: Area): boolean =>
  subject[axis.size] > frame[axis.size];

export const isTooBigToAutoScrollViewport = (viewport: Area, subject: Area, proposedScroll: Position): boolean => {
  if (proposedScroll.x !== 0 && subject.width > viewport.width) {
    return true;
  }

  if (proposedScroll.y !== 0 && subject.height > viewport.width) {
    return true;
  }

  return false;
};

