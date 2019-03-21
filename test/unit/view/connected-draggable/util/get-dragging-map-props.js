// @flow
import invariant from 'tiny-invariant';
import type {
  MappedProps,
  MapProps,
  DraggingMapProps,
} from '../../../../../src/view/draggable/draggable-types';

export default (mapProps: MapProps): DraggingMapProps => {
  const mapped: MappedProps = mapProps.mapped;
  invariant(mapped.type === 'DRAGGING');
  return mapped;
};
