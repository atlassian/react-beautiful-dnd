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
  expect(console.warn).toHaveBeenCalled();

  // cleanup
  console.warn.mockRestore();
};

forEach((control: Control) => {
  it('should abort a pending drag', () => {
    // not relevant for control
    if (!control.hasPreLift) {
      expect(true).toBeTruthy();
      return;
    }

    const callbacks: Callbacks = getStubCallbacks();
    const wrapper: ReactWrapper<*> = getWrapper(callbacks);

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
    const wrapper: ReactWrapper<*> = getWrapper(callbacks);

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
    const wrapper: ReactWrapper<*> = getWrapper(callbacks);

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
    const wrapper: ReactWrapper<*> = getWrapper(callbacks);

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
