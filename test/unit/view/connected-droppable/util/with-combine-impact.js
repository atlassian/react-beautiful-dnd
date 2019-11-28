// @flow
import type { DragImpact, Combine } from '../../../../../src/types';

export default (impact: DragImpact, combine: Combine): DragImpact => ({
  ...impact,
  at: {
    type: 'COMBINE',
    combine,
  },
});
