// @flow
import type { DragImpact, Displacement } from '../../types';
import getDisplacementMap from '../get-displacement-map';

export default (impact: DragImpact, displaced: Displacement[]): DragImpact => ({
  ...impact,
  movement: {
    ...impact.movement,
    displaced,
    map: getDisplacementMap(displaced),
  },
});
