// @flow
import type { Position } from '../types';

export const add = (point1: Position, point2: Position): Position => ({
  x: point1.x + point2.x,
  y: point1.y + point2.y,
});

export const subtract = (point1: Position, point2: Position): Position => ({
  x: point1.x - point2.x,
  y: point1.y - point2.y,
});

export const isEqual = (point1: Position, point2: Position): boolean =>
  point1.x === point2.x && point1.y === point2.y;

export const negate = (point: Position): Position => ({
  // if the value is already 0, do not return -0
  x: point.x !== 0 ? -point.x : 0,
  y: point.y !== 0 ? -point.y : 0,
});

export const patch = (
  line: 'x' | 'y',
  value: number,
  otherValue?: number = 0
): Position => ({
  [line]: value,
  [line === 'x' ? 'y' : 'x']: otherValue,
});
