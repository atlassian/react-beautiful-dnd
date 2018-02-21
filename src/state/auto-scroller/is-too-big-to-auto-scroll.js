// @flow
import type { Area, Axis } from '../../types';

export const isTooBigToAutoScrollDroppable = (axis: Axis, frame: Area, subject: Area): boolean =>
  subject[axis.size] > frame[axis.size];

export const isTooBigToAutoScrollViewport = (viewport: Area, subject: Area): boolean =>
  subject.width > viewport.width || subject.height > viewport.height;

