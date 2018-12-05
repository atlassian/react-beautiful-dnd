// @flow
import type { Position } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import type { DroppableDimension } from '../../../../../src/types';
import { scrollableViewport, windowScrollSize } from './util/viewport';
import dragTo from './util/drag-to';
import getScroller, {
  type PublicArgs,
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import getDistanceThresholds, {
  type DistanceThresholds,
} from '../../../../../src/state/auto-scroller/fluid-scroller/get-scroll/get-scroll-on-axis/get-distance-thresholds';
import { patch, origin } from '../../../../../src/state/position';
import getArgsMock from './util/get-args-mock';
import { getDroppableDimension } from '../../../../utils/dimension';

forEach(({ axis, state }: BlockFnArgs) => {
  const custom: DroppableDimension = getDroppableDimension({
    descriptor: {
      id: 'scrollable that is similiar to the viewport',
      type: 'TYPE',
    },
    direction: axis.direction,
    borderBox: {
      top: 0,
      left: 0,
      // bigger than the frame
      right: windowScrollSize.scrollWidth,
      bottom: windowScrollSize.scrollHeight,
    },
    closest: {
      borderBox: scrollableViewport.frame,
      scrollSize: {
        scrollWidth: windowScrollSize.scrollWidth,
        scrollHeight: windowScrollSize.scrollHeight,
      },
      scroll: origin,
      shouldClipSubject: true,
    },
  });
  const thresholds: DistanceThresholds = getDistanceThresholds(
    scrollableViewport.frame,
    axis,
  );

  it('should scroll the window only if both the window and droppable can be scrolled', () => {
    const mocks: PublicArgs = getArgsMock();
    const scroller: FluidScroller = getScroller(mocks);

    const onMaxBoundary: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxScrollValueAt,
      scrollableViewport.frame.center[axis.crossAxisLine],
    );

    scroller.start(
      dragTo({
        selection: onMaxBoundary,
        viewport: scrollableViewport,
        state,
        droppable: custom,
      }),
    );
    requestAnimationFrame.step();

    expect(mocks.scrollWindow).toHaveBeenCalled();
    expect(mocks.scrollDroppable).not.toHaveBeenCalled();
  });
});
