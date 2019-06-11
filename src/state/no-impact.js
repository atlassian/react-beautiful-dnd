// @flow
import type { DisplacementGroups, DragImpact, DisplacedBy } from '../types';
import { origin } from './position';

export const noDisplacedBy: DisplacedBy = {
  point: origin,
  value: 0,
};

export const emptyGroups: DisplacementGroups = {
  invisible: {},
  visible: {},
};

const noImpact: DragImpact = {
  displaced: emptyGroups,
  displacedBy: noDisplacedBy,
  closestDisplaced: null,
  at: null,
};

export default noImpact;
