// @flow
import withCriticalReplacement from './with-critical-replacement';
import withoutCriticalReplacement from './without-critical-replacement';
import type {
  BulkCollectionState,
  DropPendingState,
  Critical,
  DimensionMap,
  Viewport,
} from '../../types';
import type { Result } from './bulk-replace-types';

type Args = {|
  state: BulkCollectionState | DropPendingState,
  viewport: Viewport,
  critical: ?Critical,
  dimensions: DimensionMap,
|}

export default ({
  state,
  viewport,
  critical,
  dimensions,
}: Args): Result => {
  if (critical) {
    return withCriticalReplacement({
      state, viewport, critical, dimensions,
    });
  }

  return withoutCriticalReplacement({
    state, viewport, dimensions,
  });
};
