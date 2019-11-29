// @flow
import { getRect } from 'css-box-model';
import type { Rect, Position } from 'css-box-model';
import { offsetByPosition } from './spacing';

export const offsetRectByPosition = (rect: Rect, point: Position): Rect =>
  getRect(offsetByPosition(rect, point));
