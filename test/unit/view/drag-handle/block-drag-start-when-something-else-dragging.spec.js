// @flow
import { forEach, type Control } from './util/controls';
import { getStubCallbacks, callbacksCalled } from './util/callbacks';
import { getWrapper } from './util/wrappers';
import type { AppContextValue } from '../../../../src/view/context/app-context';
import basicContext from './util/app-context';

forEach((control: Control) => {
  it('should not start a drag if something else is already dragging in the system', () => {
    // faking a 'false' response
    const canLift = jest.fn().mockImplementation(() => false);
    const customContext: AppContextValue = {
      ...basicContext,
      canLift,
    };

    const callbacks = getStubCallbacks();
    const wrapper = getWrapper(callbacks, customContext);
    control.preLift(wrapper);
    control.lift(wrapper);
    control.drop(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(canLift).toHaveBeenCalledWith('my-draggable');
  });
});
