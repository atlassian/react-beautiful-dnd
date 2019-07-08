// @flow
import { getRect, type Position } from 'css-box-model';
import type {
  DraggingState,
  Viewport,
  MovementMode,
} from '../../../../src/types';
import { createViewport } from '../../../utils/viewport';
import getStatePreset from '../../../utils/get-simple-state-preset';
import getScroller, { type Args } from '../../../../src/state/auto-scroller';
import type { AutoScroller } from '../../../../src/state/auto-scroller/auto-scroller-types';
import { origin } from '../../../../src/state/position';

const state = getStatePreset();

const getMocks = (): Args => ({
  scrollDroppable: jest.fn(),
  scrollWindow: jest.fn(),
  move: jest.fn(),
});

const windowScrollSize = {
  scrollHeight: 2000,
  scrollWidth: 1600,
};
const scrollableViewport: Viewport = createViewport({
  frame: getRect({
    top: 0,
    left: 0,
    right: 800,
    bottom: 1000,
  }),
  scrollHeight: windowScrollSize.scrollHeight,
  scrollWidth: windowScrollSize.scrollWidth,
  scroll: origin,
});

const onCenter = (mode: MovementMode): DraggingState => ({
  ...state.dragging(
    state.preset.inHome1.descriptor.id,
    scrollableViewport.frame.center,
    scrollableViewport,
  ),
  movementMode: mode,
});

const onEnd = (mode: MovementMode): DraggingState => ({
  ...state.dragging(
    state.preset.inHome1.descriptor.id,
    {
      x: scrollableViewport.frame.right,
      y: scrollableViewport.frame.bottom,
    },
    scrollableViewport,
  ),
  movementMode: mode,
});

it('should use the fluid scroller when in fluid mode', () => {
  const mocks: Args = getMocks();
  const scroller: AutoScroller = getScroller(mocks);

  // lift in center - should not cause an auto scroll
  scroller.start(onCenter('FLUID'));
  requestAnimationFrame.flush();
  expect(mocks.scrollWindow).not.toHaveBeenCalled();

  // now scrolling on visibile edge. Should cause a big auto scroll
  // this will be done with the fluid scroller
  scroller.scroll(onEnd('FLUID'));
  requestAnimationFrame.step();
  expect(mocks.scrollWindow).toHaveBeenCalled();
});

it('should use the jump scroller when in SNAP mode and there is a jumpScrollerRequest', () => {
  const mocks: Args = getMocks();
  const scroller: AutoScroller = getScroller(mocks);

  // lift in center - should not cause an auto scroll
  scroller.start(onCenter('SNAP'));
  requestAnimationFrame.flush();
  expect(mocks.scrollWindow).not.toHaveBeenCalled();

  // now scrolling on visibile edge. Should not cause an auto scroll because we are in SNAP mode
  scroller.scroll(onEnd('SNAP'));
  requestAnimationFrame.step();
  expect(mocks.scrollWindow).not.toHaveBeenCalled();

  const request: Position = { x: 1, y: 1 };
  const withRequest: DraggingState = state.scrollJumpRequest(
    request,
    scrollableViewport,
  );
  scroller.scroll(withRequest);
  requestAnimationFrame.step();
  expect(mocks.scrollWindow).toHaveBeenCalled();
});
