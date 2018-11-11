// @flow
import invariant from 'tiny-invariant';
import type {
  MapProps,
  SecondaryMapProps,
} from '../../../../../src/view/draggable/draggable-types';

export default (mapProps: MapProps) => {
  const secondary: ?SecondaryMapProps = mapProps.secondary;
  invariant(secondary);
  return secondary;
};
