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
import getDroppable from './util/get-droppable';
import { patch } from '../../../../../src/state/position';
import { addDroppable } from '../../../../utils/dimension';

forEach(({ axis, scroller, state, mocks, preset }: BlockFnArgs) => {
  it('should cancel any pending window scroll', () => {
    const thresholds: PixelThresholds = getPixelThresholds(
      scrollableViewport.frame,
      axis,
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxSpeedAt,
      scrollableViewport.frame.center[axis.crossAxisLine],
    );

    scroller(
      dragTo({
        state,
        selection: onMaxBoundary,
        viewport: scrollableViewport,
      }),
    );

    // frame not cleared
    expect(mocks.scrollWindow).not.toHaveBeenCalled();

    scroller.cancel();
    requestAnimationFrame.flush();

    expect(mocks.scrollWindow).not.toHaveBeenCalled();
  });

  it('should cancel any pending droppable scroll', () => {
    const { scrollable, frameClient } = getDroppable(preset);
    const thresholds: PixelThresholds = getPixelThresholds(
      frameClient.borderBox,
      axis,
    );
    const onMaxBoundary: Position = patch(
      axis.line,
      frameClient.borderBox[axis.size] - thresholds.maxSpeedAt,
      frameClient.borderBox.center[axis.crossAxisLine],
    );
    const drag: DraggingState = addDroppable(
      dragTo({
        state,
        selection: onMaxBoundary,
        viewport: scrollableViewport,
      }),
      scrollable,
    );

    scroller(drag);

    // frame not cleared
    expect(mocks.scrollDroppable).not.toHaveBeenCalled();

    // should cancel the next frame
    scroller.cancel();
    requestAnimationFrame.flush();

    expect(mocks.scrollDroppable).not.toHaveBeenCalled();
  });
});
