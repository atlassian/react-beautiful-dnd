// @flow
import type { Position, Spacing } from 'css-box-model';
import forEach, { type BlockFnArgs } from './util/for-each';
import type {
  DraggableDimension,
  DraggingState,
} from '../../../../../src/types';
import { scrollableViewport, unscrollableViewport } from './util/viewport';
import getDroppable from './util/get-droppable';
import dragTo from './util/drag-to';
import getScroller, {
  type PublicArgs,
  type FluidScroller,
} from '../../../../../src/state/auto-scroller/fluid-scroller';
import getDistanceThresholds, {
  type DistanceThresholds,
} from '../../../../../src/state/auto-scroller/fluid-scroller/get-scroll/get-scroll-on-axis/get-distance-thresholds';
import {
  patch,
  add,
  subtract,
  negate,
} from '../../../../../src/state/position';
import getArgsMock from './util/get-args-mock';
import config from '../../../../../src/state/auto-scroller/fluid-scroller/config';
import scrollDroppable from '../../../../../src/state/droppable/scroll-droppable';
import { vertical, horizontal } from '../../../../../src/state/axis';
import { expandByPosition } from '../../../../../src/state/spacing';
import {
  getDraggableDimension,
  addDraggable,
} from '../../../../utils/dimension';

forEach(({ axis, state, preset }: BlockFnArgs) => {
  describe('window', () => {
    const thresholds: DistanceThresholds = getDistanceThresholds(
      scrollableViewport.frame,
      axis,
    );
    const crossAxisThresholds: DistanceThresholds = getDistanceThresholds(
      scrollableViewport.frame,
      axis === vertical ? horizontal : vertical,
    );

    const onMaxBoundaryOfBoth: Position = patch(
      axis.line,
      scrollableViewport.frame[axis.size] - thresholds.maxScrollValueAt,
      scrollableViewport.frame[axis.crossAxisSize] -
        crossAxisThresholds.maxScrollValueAt,
    );

    it('should allow scrolling on the cross axis if too big on the main axis', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const biggerOnMainAxis: Spacing = expandByPosition(
        scrollableViewport.frame,
        patch(axis.line, 1),
      );
      const tooBigOnMainAxis: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: biggerOnMainAxis,
      });
      const first: DraggingState = addDraggable(
        dragTo({
          viewport: scrollableViewport,
          selection: onMaxBoundaryOfBoth,
          state,
        }),
        tooBigOnMainAxis,
      );

      scroller.start(first);
      requestAnimationFrame.step();

      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        // $FlowFixMe - using expect.any
        patch(axis.crossAxisLine, expect.any(Number)),
      );
    });

    it('should allow scrolling on the main axis if too big on the cross axis', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const biggerOnCrossAxis: Spacing = expandByPosition(
        scrollableViewport.frame,
        patch(axis.crossAxisLine, 1),
      );
      const tooBigOnCrossAxis: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: biggerOnCrossAxis,
      });
      const first: DraggingState = addDraggable(
        dragTo({
          viewport: scrollableViewport,
          selection: onMaxBoundaryOfBoth,
          state,
        }),
        tooBigOnCrossAxis,
      );

      scroller.start(first);
      requestAnimationFrame.step();

      expect(mocks.scrollWindow).toHaveBeenCalledWith(
        // $FlowFixMe - using expect.any
        patch(axis.line, expect.any(Number)),
      );
    });

    it('should not allow scrolling on any axis if too big on both axis', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const biggerOnBothAxis: Spacing = expandByPosition(
        scrollableViewport.frame,
        patch(axis.line, 1, 1),
      );
      const tooBig: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: biggerOnBothAxis,
      });
      const first: DraggingState = addDraggable(
        dragTo({
          viewport: scrollableViewport,
          selection: onMaxBoundaryOfBoth,
          state,
        }),
        tooBig,
      );

      scroller.start(first);
      requestAnimationFrame.flush();

      expect(mocks.scrollWindow).not.toHaveBeenCalled();
    });
  });

  describe('droppable', () => {
    const { scrollable, frameClient } = getDroppable(preset);
    const thresholds: DistanceThresholds = getDistanceThresholds(
      frameClient.borderBox,
      axis,
    );
    const crossAxisThresholds: DistanceThresholds = getDistanceThresholds(
      frameClient.borderBox,
      axis === vertical ? horizontal : vertical,
    );
    const onMaxBoundaryOfBoth: Position = patch(
      axis.line,
      frameClient.borderBox[axis.size] - thresholds.maxScrollValueAt,
      frameClient.borderBox[axis.crossAxisSize] -
        crossAxisThresholds.maxScrollValueAt,
    );

    it('should allow scrolling on the cross axis if too big on the main axis', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const biggerOnMainAxis: Spacing = expandByPosition(
        frameClient.borderBox,
        patch(axis.line, 1),
      );
      const tooBigOnMainAxis: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: biggerOnMainAxis,
      });
      const first: DraggingState = addDraggable(
        dragTo({
          viewport: unscrollableViewport,
          selection: onMaxBoundaryOfBoth,
          state,
          droppable: scrollable,
        }),
        tooBigOnMainAxis,
      );

      scroller.start(first);
      requestAnimationFrame.step();

      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrollable.descriptor.id,
        // $FlowFixMe - using expect.any
        patch(axis.crossAxisLine, expect.any(Number)),
      );
    });

    it('should allow scrolling on the main axis if too big on the cross axis', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const biggerOnCrossAxis: Spacing = expandByPosition(
        frameClient.borderBox,
        patch(axis.crossAxisLine, 1),
      );
      const tooBigOnCrossAxis: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: biggerOnCrossAxis,
      });
      const first: DraggingState = addDraggable(
        dragTo({
          viewport: unscrollableViewport,
          selection: onMaxBoundaryOfBoth,
          droppable: scrollable,
          state,
        }),
        tooBigOnCrossAxis,
      );

      scroller.start(first);
      requestAnimationFrame.step();

      expect(mocks.scrollDroppable).toHaveBeenCalledWith(
        scrollable.descriptor.id,
        // $FlowFixMe - using expect.any
        patch(axis.line, expect.any(Number)),
      );
    });

    it('should not allow scrolling on any axis if too big on both axis', () => {
      const mocks: PublicArgs = getArgsMock();
      const scroller: FluidScroller = getScroller(mocks);
      const biggerOnBothAxis: Spacing = expandByPosition(
        frameClient.borderBox,
        patch(axis.line, 1, 1),
      );
      const tooBig: DraggableDimension = getDraggableDimension({
        descriptor: preset.inHome1.descriptor,
        borderBox: biggerOnBothAxis,
      });
      const first: DraggingState = addDraggable(
        dragTo({
          viewport: unscrollableViewport,
          selection: onMaxBoundaryOfBoth,
          droppable: scrollable,
          state,
        }),
        tooBig,
      );

      scroller.start(first);
      requestAnimationFrame.flush();

      expect(mocks.scrollDroppable).not.toHaveBeenCalled();
    });
  });
});
