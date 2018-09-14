// @flow
import type { Displacement } from '../../../../../../src/types';
import getDisplacementMap from '../../../../../../src/state/get-displacement-map';

export const getDisplacedWithMap = (displaced: Displacement[]) => ({
  displaced,
  map: getDisplacementMap(displaced),
});
