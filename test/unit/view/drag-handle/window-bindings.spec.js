// @flow
import type { ReactWrapper } from 'enzyme';
import type { Callbacks } from '../../../../src/view/drag-handle/drag-handle-types';
import { forEach, type Control } from './util/controls';
import { getWrapper } from './util/wrappers';
import { getStubCallbacks } from './util/callbacks';
import { windowMouseClick } from './util/events';

forEach((control: Control) => {
  let wrapper: ReactWrapper;
  let callbacks: Callbacks;

  beforeEach(() => {
    callbacks = getStubCallbacks();
    wrapper = getWrapper(callbacks);
  });

  it('should unbind all window listeners when drag ends', () => {
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
    // We need to exclude event listener bindings for error events
    // Enzyme adds them to support componentDidCatch testing
    const countWithErrorsExcluded = (stub): number =>
      stub.mock.calls.filter((args: mixed[]) => args[0] !== 'error').length;
    const getAddCount = (): number =>
      countWithErrorsExcluded(window.addEventListener);
    const getRemoveCount = (): number =>
      countWithErrorsExcluded(window.removeEventListener);

    // initial validation
    expect(getAddCount()).toBe(0);
    expect(getRemoveCount()).toBe(0);

    control.preLift(wrapper);
    control.lift(wrapper);

    // window events bound
    expect(getAddCount()).toBeGreaterThan(0);
    // nothing unbound yet
    expect(getRemoveCount()).toBe(0);

    // ending the drag
    control.drop(wrapper);

    if (!control.hasPostDragClickBlocking) {
      expect(getAddCount()).toBe(getRemoveCount());
    } else {
      // we have added post drag listeners
      expect(getAddCount()).toBeGreaterThan(getRemoveCount());

      // finish the post drag blocking
      windowMouseClick();

      // everything is now unbound
      expect(getAddCount()).toBe(getRemoveCount());
    }

    // cleanup
    window.addEventListener.mockRestore();
    window.removeEventListener.mockRestore();
  });

  it('should bind window scroll listeners as non-capture to avoid picking up droppable scroll events', () => {
    // Scroll events on elements do not bubble, but they go through the capture phase
    // https://twitter.com/alexandereardon/status/985994224867819520
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');

    control.preLift(wrapper);
    control.lift(wrapper);

    const binding = window.addEventListener.mock.calls.find(
      call => call[0] === 'scroll',
    );

    if (!binding) {
      throw new Error('Count not find scroll binding');
    }

    // 0: function name
    // 1: function
    // 2: options
    const options: Object = binding[2];
    expect(options.capture).toBe(false);

    // cleanup
    window.addEventListener.mockRestore();
    window.removeEventListener.mockRestore();
    control.drop(wrapper);
  });
});
