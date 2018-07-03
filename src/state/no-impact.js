// @flow
import type { DragMovement, DragImpact } from '../types';
import { origin } from './position';

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
