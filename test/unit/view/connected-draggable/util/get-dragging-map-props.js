// @flow
import invariant from 'tiny-invariant';
import type {
  MapProps,
  DraggingMapProps,
} from '../../../../../src/view/draggable/draggable-types';

export default (mapProps: MapProps) => {
  const dragging: ?DraggingMapProps = mapProps.dragging;
  invariant(dragging);
  return dragging;
};
