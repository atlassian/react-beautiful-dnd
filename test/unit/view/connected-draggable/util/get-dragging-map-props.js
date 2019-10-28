// @flow
import type {
  MappedProps,
  MapProps,
  DraggingMapProps,
} from '../../../../../src/view/draggable/draggable-types';
import { invariant } from '../../../../../src/invariant';

export default (mapProps: MapProps): DraggingMapProps => {
  const mapped: MappedProps = mapProps.mapped;
  invariant(mapped.type === 'DRAGGING');
  return mapped;
};
