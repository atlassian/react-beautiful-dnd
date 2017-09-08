// @flow
import type { DragMovement, DragImpact, Position } from '../types';

const origin: Position = { x: 0, y: 0 };

export const noMovement: DragMovement = {
  draggables: [],
  amount: origin,
  isBeyondStartPosition: false,
};

const noImpact: DragImpact = {
  movement: noMovement,
  direction: null,
  destination: null,
};

export default noImpact;
