// @flow
import type { Displacement } from '../../../../../../../src/types';
import getDisplacementMap from '../../../../../../../src/state/get-displacement-map';

export default (displaced: Displacement[]) => ({
  displaced,
  map: getDisplacementMap(displaced),
});
