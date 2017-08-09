// @flow
import type { DragMovement, DragImpact } from '../types';

const noMovement: DragMovement = {
  draggables: [],
  amount: 0,
  isMovingForward: false,
};

const noImpact: DragImpact = {
  movement: noMovement,
  destination: null,
};

export default noImpact;
