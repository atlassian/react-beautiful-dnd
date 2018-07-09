// @flow
import type { ReactWrapper } from 'enzyme';
import { forEach, type Control } from './util/controls';
import { getWrapper } from './util/wrappers';
import { getStubCallbacks, callbacksCalled } from './util/callbacks';
import type { Callbacks } from '../../../../src/view/drag-handle/drag-handle-types';

const expectMidDragDisabledWarning = (fn: Function) => {
  // arrange
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  // act
  fn();

  // assert
  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      'You have disabled dragging on a Draggable while it was dragging',
    ),
  );

  // cleanup
  console.warn.mockRestore();
};

forEach((control: Control) => {
  it('should abort a pending drag', () => {
    // not relevant for control
    if (!control.hasPreLift) {
      return;
    }

    const callbacks: Callbacks = getStubCallbacks();
    const wrapper: ReactWrapper = getWrapper(callbacks);

    control.preLift(wrapper);

    wrapper.setProps({ isEnabled: false });

    control.lift(wrapper);
    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
  });

  it('should cancel an existing drag', () => {
    const callbacks: Callbacks = getStubCallbacks();
    const wrapper: ReactWrapper = getWrapper(callbacks);

    control.preLift(wrapper);
    control.lift(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
      }),
    ).toBe(true);

    expectMidDragDisabledWarning(() => {
      wrapper.setProps({ isEnabled: false });
    });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should stop publishing movements', () => {
    const callbacks: Callbacks = getStubCallbacks();
    const wrapper: ReactWrapper = getWrapper(callbacks);

    control.preLift(wrapper);
    control.lift(wrapper);

    expectMidDragDisabledWarning(() => {
      wrapper.setProps({ isEnabled: false });
    });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    control.move(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should allow subsequent drags', () => {
    const callbacks: Callbacks = getStubCallbacks();
    const wrapper: ReactWrapper = getWrapper(callbacks);

    control.preLift(wrapper);
    control.lift(wrapper);

    expectMidDragDisabledWarning(() => {
      wrapper.setProps({ isEnabled: false });
    });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    wrapper.setProps({ isEnabled: true });

    control.preLift(wrapper);
    control.lift(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 2,
        onCancel: 1,
      }),
    ).toBe(true);
  });
});

// it('should cancel any pending window scroll movements', () => {
//   // lift
//   mouseDown(wrapper);
//   windowMouseMove({ x: 0, y: sloppyClickThreshold });

//   expect(callbacksCalled(callbacks)({ onLift: 1 })).toBe(true);

//   // scroll is queued
//   dispatchWindowEvent('scroll');
//   expect(callbacks.onWindowScroll).not.toHaveBeenCalled();

//   // disable drag handle
//   wrapper.setProps({ isEnabled: false });

//   // flushing the animation would normally trigger a window scroll movement
//   requestAnimationFrame.flush();
//   expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
//   expect(callbacks.onCancel).toHaveBeenCalled();
// });

// it('should cancel an existing drag', () => {
//   // lift
//   mouseDown(wrapper);
//   windowMouseMove({ x: 0, y: sloppyClickThreshold });
//   // move
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   requestAnimationFrame.step();

//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 0,
//     }),
//   ).toBe(true);

//   wrapper.setProps({ isEnabled: false });
//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 1,
//     }),
//   ).toBe(true);
// });

// it('should stop listening to mouse events', () => {
//   // lift
//   mouseDown(wrapper);
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   // move
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   requestAnimationFrame.step();

//   wrapper.setProps({ isEnabled: false });
//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 1,
//     }),
//   ).toBe(true);

//   // should have no impact
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 1 });
//   requestAnimationFrame.step();
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
//   requestAnimationFrame.step();
//   windowMouseUp();
//   windowMouseMove({ x: 0, y: sloppyClickThreshold + 2 });
//   requestAnimationFrame.step();

//   // being super safe
//   requestAnimationFrame.flush();

//   expect(
//     callbacksCalled(callbacks)({
//       onLift: 1,
//       onMove: 1,
//       onCancel: 1,
//     }),
//   ).toBe(true);
// });
