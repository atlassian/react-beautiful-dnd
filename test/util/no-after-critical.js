// @flow
import type { LiftEffect } from '../../src/types';
import { origin } from '../../src/state/position';

const noOnLift: LiftEffect = {
  effected: {},
  inVirtualList: false,
  displacedBy: {
    point: origin,
    value: 0,
  },
};

export default noOnLift;
