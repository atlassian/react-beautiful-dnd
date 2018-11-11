// @flow
import { forward } from '../../../../../src/state/user-direction/user-direction-preset';
import type { DragImpact, Combine } from '../../../../../src/types';

export default (impact: DragImpact, combine: Combine) => ({
  ...impact,
  destination: null,
  merge: {
    whenEntered: forward,
    combine,
  },
});
