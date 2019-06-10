// @flow
import type { OnLift } from '../../src/types';
import { origin } from '../../src/state/position';

const noOnLift: OnLift = {
  wasDisplaced: {},
  displacedBy: {
    point: origin,
    value: 0,
  },
};

export default noOnLift;
