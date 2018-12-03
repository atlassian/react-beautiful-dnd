// @flow

import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import type { DraggingState } from '../../../../../src/types';
import { scrollableViewport } from './util/viewport';
import dragTo from './util/drag-to';
import {
  getPixelThresholds,
  type PixelThresholds,
} from '../../../../../src/state/auto-scroller/fluid-scroller';

forEach(({ axis, scroller, state, mocks, preset }: BlockFnArgs) => {
  const thresholds: PixelThresholds = getPixelThresholds(
    scrollableViewport.frame,
    axis,
  );

  scroller.start();
});
