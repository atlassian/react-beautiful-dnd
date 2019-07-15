// @flow
import type {
  DisplacementGroups,
  DragImpact,
  DisplacedBy,
  LiftEffect,
} from '../types';
import { origin } from './position';

export const noDisplacedBy: DisplacedBy = {
  point: origin,
  value: 0,
};

export const emptyGroups: DisplacementGroups = {
  invisible: {},
  visible: {},
  all: [],
};

const noImpact: DragImpact = {
  displaced: emptyGroups,
  displacedBy: noDisplacedBy,
  at: null,
};

export default noImpact;

export const noAfterCritical: LiftEffect = {
  inVirtualList: false,
  effected: {},
  displacedBy: noDisplacedBy,
};
