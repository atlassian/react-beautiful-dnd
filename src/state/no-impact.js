// @flow
import { type Position } from 'css-box-model';
import type { DragMovement, DragImpact } from '../types';

const origin: Position = { x: 0, y: 0 };

export const noMovement: DragMovement = {
  displaced: [],
  amount: origin,
  isBeyondStartPosition: false,
};

const noImpact: DragImpact = {
  movement: noMovement,
  direction: null,
  destination: null,
};

export default noImpact;
