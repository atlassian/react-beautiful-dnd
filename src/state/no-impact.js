// @flow
import type { DragMovement, DragImpact, DisplacedBy } from '../types';
import { origin } from './position';

export const noDisplacedBy: DisplacedBy = {
  point: origin,
  value: 0,
};

export const noMovement: DragMovement = {
  displaced: [],
  map: {},
  displacedBy: noDisplacedBy,
  isInFrontOfStart: false,
};

const noImpact: DragImpact = {
  movement: noMovement,
  direction: null,
  destination: null,
  group: null,
};

export default noImpact;
