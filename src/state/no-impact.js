// @flow
import type { DragMovement, DragImpact } from '../types';
import { origin } from './position';

export const noMovement: DragMovement = {
  displaced: [],
  map: {},
  amount: origin,
  isInFrontOfStart: false,
};

const noImpact: DragImpact = {
  movement: noMovement,
  direction: null,
  destination: null,
  group: null,
};

export default noImpact;
