// @flow
import invariant from 'tiny-invariant';
import type {
  MapProps,
  MappedProps,
  SecondaryMapProps,
} from '../../../../../src/view/draggable/draggable-types';

export default (mapProps: MapProps): SecondaryMapProps => {
  const mapped: MappedProps = mapProps.mapped;
  invariant(mapped.type === 'SECONDARY');
  return mapped;
};
