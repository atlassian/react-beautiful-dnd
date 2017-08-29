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

// Allows you to build a position from values.
// Really useful when working with the Axis type
// patch('x', 5)    = { x: 5, y: 0 }
// patch('x', 5, 1) = { x: 5, y: 1 }
export const patch = (
  line: 'x' | 'y',
  value: number,
  otherValue?: number = 0
): Position => ({
  // set the value of 'x', or 'y'
  [line]: value,
  // set the value of the other line
  [line === 'x' ? 'y' : 'x']: otherValue,
});

// Returns the distance between two points
// https://www.mathsisfun.com/algebra/distance-2-points.html
export const distance = (point1: Position, point2: Position): number =>
  Math.sqrt(
    Math.pow((point2.x - point1.x), 2) +
    Math.pow((point2.y - point1.y), 2)
  );

// When given a list of points, it finds the smallest distance to any point
export const closest = (target: Position, points: Position[]): number =>
  Math.min(...points.map((point: Position) => distance(target, point)));
