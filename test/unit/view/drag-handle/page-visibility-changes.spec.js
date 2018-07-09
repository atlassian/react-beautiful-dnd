// @flow
import { forEach, type Control } from './util/controls';
import { getWrapper } from './util/wrappers';
import { getStubCallbacks, callbacksCalled } from './util/callbacks';
import { dispatchWindowEvent } from '../../../utils/user-input-util';

forEach((control: Control) => {
  it('should cancel the drag on page visibility changes', () => {
    const callbacks = getStubCallbacks();
    const wrapper = getWrapper(callbacks);
    control.preLift(wrapper);
    control.lift(wrapper);

    dispatchWindowEvent('visibilitychange');

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    control.drop(wrapper);
  });
});
