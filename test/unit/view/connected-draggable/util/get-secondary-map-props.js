// @flow
import type {
  MapProps,
  MappedProps,
  SecondaryMapProps,
} from '../../../../../src/view/draggable/draggable-types';
import { invariant } from '../../../../../src/invariant';

export default (mapProps: MapProps): SecondaryMapProps => {
  const mapped: MappedProps = mapProps.mapped;
  invariant(mapped.type === 'SECONDARY');
  return mapped;
};
