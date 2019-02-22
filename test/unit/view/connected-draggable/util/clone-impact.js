// @flow
import type { DragImpact } from '../../../../../src/types';

export default (target: DragImpact): DragImpact =>
  JSON.parse(JSON.stringify(target));
