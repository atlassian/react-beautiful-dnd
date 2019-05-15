// @flow
import { getRect, type Position } from 'css-box-model';
import { type ReactWrapper } from 'enzyme';
import * as keyCodes from '../../../../src/view/key-codes';
import * as getWindowFromEl from '../../../../src/view/window/get-window-from-el';
import { withKeyboard } from '../../../utils/user-input-util';
import {
  callbacksCalled,
  getStubCallbacks,
  whereAnyCallbacksCalled,
} from './util/callbacks';
import {
  auxiliaryButton,
  createMockEvent,
  isAWindowClickPrevented,
  type MockEvent,
  mouseClick,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressEnter,
  pressEscape,
  pressSpacebar,
  pressTab,
  primaryButton,
  touchStart,
  windowEscape,
  windowMouseDown,
  windowMouseMove,
} from './util/events';
import { getWrapper } from './util/wrappers';
import type { Callbacks } from '../../../../src/view/use-drag-handle/drag-handle-types';
import type { AppContextValue } from '../../../../src/view/context/app-context';
import basicContext from './util/app-context';

const origin: Position = { x: 0, y: 0 };

let callbacks: Callbacks;
let wrapper: ReactWrapper<*>;

beforeAll(() => {
  requestAnimationFrame.reset();
  jest.useFakeTimers();
});

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  callbacks = getStubCallbacks();
  wrapper = getWrapper(callbacks);
});

afterEach(() => {
  if (wrapper.length) {
    wrapper.unmount();
  }
  console.warn.mockRestore();
  console.error.mockRestore();
});

describe('initiation', () => {
  it('should lift when a user presses the space bar and use the center as the selection point', () => {
    const fakeCenter: Position = {
      x: 50,
      y: 80,
    };
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() =>
        getRect({
          left: 0,
          top: 0,
          right: fakeCenter.x * 2,
          bottom: fakeCenter.y * 2,
        }),
      );

    const event: MockEvent = createMockEvent();
    pressSpacebar(wrapper, event);

    expect(callbacks.onLift).toHaveBeenCalledWith({
      clientSelection: fakeCenter,
      movementMode: 'SNAP',
    });
    // default action is prevented
    expect(event.preventDefault).toHaveBeenCalled();

    HTMLElement.prototype.getBoundingClientRect.mockRestore();
  });

  it('should stop the event before it can be listened to', () => {
    const mockEvent: MockEvent = createMockEvent();

    pressSpacebar(wrapper, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not lift if another sensor is capturing', () => {
    // stealing the capture
    touchStart(wrapper);

    // would normally start a drag
    const mock: MockEvent = createMockEvent();
    pressSpacebar(wrapper, mock);

    // not starting a drag
    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    // not preventing default on the event
    expect(mock.preventDefault).not.toHaveBeenCalled();
  });

  it('should not lift if disabled', () => {
    const mock: MockEvent = createMockEvent();
    wrapper.setProps({
      isEnabled: false,
    });

    pressSpacebar(wrapper, mock);

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(mock.preventDefault).not.toHaveBeenCalled();
  });

  it('should not lift if the state does not currently allow lifting', () => {
    const customCallbacks: Callbacks = getStubCallbacks();
    const customContext: AppContextValue = {
      ...basicContext,
      canLift: () => false,
    };
    const customWrapper = getWrapper(customCallbacks, customContext);
    const mock: MockEvent = createMockEvent();

    pressSpacebar(customWrapper, mock);

    expect(
      callbacksCalled(callbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    // not preventing browser event
    expect(mock.preventDefault).not.toHaveBeenCalled();
  });
});

describe('progress', () => {
  it('should prevent tabbing away from the element while dragging', () => {
    const mockEvent: MockEvent = createMockEvent();

    pressSpacebar(wrapper);
    // pressing tab on the element itself as it must have focus to drag
    pressTab(wrapper, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should prevent submitting the dragging item', () => {
    const mockEvent: MockEvent = createMockEvent();

    pressSpacebar(wrapper);
    // pressing enter on the element itself as it must have focus to drag
    pressEnter(wrapper, mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not take into account any mouse movements', () => {
    pressSpacebar(wrapper);

    const event: MouseEvent = windowMouseMove();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onMove: 0,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should instantly fire a scroll action when the window scrolls', () => {
    // lift
    pressSpacebar(wrapper);
    // scroll event
    const event: Event = new Event('scroll');
    window.dispatchEvent(event);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onWindowScroll: 1,
      }),
    ).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not fire an onWindowScroll if the scroll event was not dispatched from window (ie11 bug)', () => {
    // start the lift
    pressSpacebar(wrapper);

    // trigger scroll event
    const scrollable: HTMLElement = document.createElement('div');
    const fakeEvent: Event = new Event('scroll');
    const fakeWindow: HTMLElement = document.createElement('div');
    const getWindowSpy = jest
      .spyOn(getWindowFromEl, 'default')
      .mockImplementation(() => fakeWindow);
    Object.defineProperties(fakeEvent, {
      target: {
        writable: true,
        value: scrollable,
      },
      currentTarget: {
        writable: true,
        value: fakeWindow,
      },
    });
    window.dispatchEvent(fakeEvent);

    expect(callbacks.onWindowScroll).not.toHaveBeenCalled();

    getWindowSpy.mockRestore();
  });

  it('should prevent using keyboard keys that modify scroll', () => {
    const keys: number[] = [
      keyCodes.pageUp,
      keyCodes.pageDown,
      keyCodes.home,
      keyCodes.end,
    ];

    // lift
    pressSpacebar(wrapper);

    keys.forEach((keyCode: number) => {
      const mockEvent: MockEvent = createMockEvent();
      const trigger = withKeyboard(keyCode);

      trigger(wrapper, mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(callbacks.onWindowScroll).not.toHaveBeenCalled();
    });
  });

  describe('directional movement', () => {
    it('should move backward when the user presses ArrowUp', () => {
      const mockEvent: MockEvent = createMockEvent();

      pressSpacebar(wrapper);
      // move backward
      pressArrowUp(wrapper, mockEvent);
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMoveUp: 1,
        }),
      ).toBe(true);
      // we are using the event as a part of the drag
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should move forward when the user presses ArrowDown', () => {
      const mockEvent: MockEvent = createMockEvent();

      pressSpacebar(wrapper);
      // move forward
      pressArrowDown(wrapper, mockEvent);
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMoveDown: 1,
        }),
      ).toBe(true);
      // we are using the event as a part of the drag
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should request to move to a droppable on the left when the user presses LeftArrow', () => {
      const mockEvent: MockEvent = createMockEvent();

      pressSpacebar(wrapper);
      pressArrowLeft(wrapper, mockEvent);
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMoveLeft: 1,
        }),
      ).toBe(true);
      // we are using the event as a part of the drag
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should request to move to a droppable on the right when the user presses RightArrow', () => {
      const mockEvent: MockEvent = createMockEvent();

      pressSpacebar(wrapper);
      pressArrowRight(wrapper, mockEvent);
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMoveRight: 1,
        }),
      ).toBe(true);
      // we are using the event as a part of the drag
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('event collapsing', () => {
    it('should collapse multiple forward movements into a single animation frame', () => {
      pressSpacebar(wrapper);

      pressArrowDown(wrapper);
      pressArrowDown(wrapper);
      pressArrowDown(wrapper);
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onMoveDown: 1,
        }),
      ).toBe(true);

      // being super safe and ensuring nothing firers later
      requestAnimationFrame.flush();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onMoveDown: 1,
        }),
      ).toBe(true);
    });

    it('should collapse multiple backward movements into a single animation frame', () => {
      pressSpacebar(wrapper);

      pressArrowUp(wrapper);
      pressArrowUp(wrapper);
      pressArrowUp(wrapper);
      requestAnimationFrame.step();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onMoveDown: 0,
          onMoveUp: 1,
        }),
      ).toBe(true);

      // being super safe and ensuring nothing firers later
      requestAnimationFrame.flush();

      expect(
        callbacksCalled(callbacks)({
          onLift: 1,
          onMove: 0,
          onMoveDown: 0,
          onMoveUp: 1,
        }),
      ).toBe(true);
    });

    it('should not fire a scheduled forward movement if no longer dragging', () => {
      pressSpacebar(wrapper);
      pressArrowDown(wrapper);
      // finishing drag before animation frame
      pressSpacebar(wrapper);

      // flushing any animation frames
      requestAnimationFrame.flush();

      expect(
        callbacksCalled(callbacks)({
          onMoveDown: 0,
          onLift: 1,
          onDrop: 1,
        }),
      ).toBe(true);
    });

    it('should not fire a scheduled backward movement if no longer dragging', () => {
      pressSpacebar(wrapper);
      pressArrowUp(wrapper);
      // finishing drag before animation frame
      pressSpacebar(wrapper);

      // flushing any animation frames
      requestAnimationFrame.flush();

      expect(
        callbacksCalled(callbacks)({
          onMoveUp: 0,
          onLift: 1,
          onDrop: 1,
        }),
      ).toBe(true);
    });
  });
});

describe('finish', () => {
  it('should drop when the user presses spacebar', () => {
    pressSpacebar(wrapper);
    pressSpacebar(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);
  });

  it('should prevent default on the event', () => {
    const lift: MockEvent = createMockEvent();
    const drop: MockEvent = createMockEvent();

    pressSpacebar(wrapper, lift);
    pressSpacebar(wrapper, drop);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    expect(lift.preventDefault).toHaveBeenCalled();
    expect(drop.preventDefault).toHaveBeenCalled();
  });
});

describe('cancel', () => {
  it('should cancel the drag when the user presses escape and prevent default on the event', () => {
    const mockEvent: MockEvent = createMockEvent();

    pressSpacebar(wrapper);
    pressEscape(wrapper, mockEvent);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should cancel when the user pushes any mouse button', () => {
    const mouseButtons: number[] = [primaryButton, auxiliaryButton];

    mouseButtons.forEach(
      (button: number, index: number): void => {
        const upArrowMock: MockEvent = createMockEvent();

        pressSpacebar(wrapper);
        const mouseDownEvent: MouseEvent = windowMouseDown(origin, button);
        // should now do nothing
        pressArrowUp(wrapper, upArrowMock);

        expect(
          callbacksCalled(callbacks)({
            onLift: index + 1,
            onCancel: index + 1,
          }),
        ).toBe(true);
        expect(mouseDownEvent.defaultPrevented).toBe(false);
        expect(upArrowMock.preventDefault).not.toHaveBeenCalled();
      },
    );
  });

  it('should not do anything if there is nothing dragging', () => {
    const event: KeyboardEvent = windowEscape();

    expect(whereAnyCallbacksCalled(callbacks)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should not prevent any subsequent window click actions', () => {
    // lift
    pressSpacebar(wrapper);
    // drop
    pressSpacebar(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onDrop: 1,
      }),
    ).toBe(true);

    expect(isAWindowClickPrevented()).toBe(false);
  });

  it('should not prevent any subsequent on element click actions', () => {
    const mockEvent: MockEvent = createMockEvent();
    pressSpacebar(wrapper);
    pressSpacebar(wrapper);

    mouseClick(wrapper, origin, primaryButton, mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});

describe('disabled mid drag', () => {
  it('should cancel the current drag', () => {
    pressSpacebar(wrapper);
    wrapper.setProps({ isDragging: true });

    wrapper.setProps({
      isEnabled: false,
    });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);
  });

  it('should drop any pending movements', () => {
    // lift
    pressSpacebar(wrapper);
    wrapper.setProps({ isDragging: true });
    wrapper.setProps({ isDragging: true });
    expect(callbacks.onLift).toHaveBeenCalledTimes(1);

    pressArrowUp(wrapper);
    pressArrowRight(wrapper);
    pressArrowDown(wrapper);
    pressArrowLeft(wrapper);
    // movement still scheduled
    expect(callbacks.onMoveUp).not.toHaveBeenCalled();

    // disabling
    wrapper.setProps({ isEnabled: false });
    expect(callbacksCalled(callbacks)({ onLift: 1, onCancel: 1 })).toBe(true);

    // flushing animation queue - would normally trigger movement
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
        onMoveUp: 0,
        onMoveRight: 0,
        onMoveDown: 0,
        onMoveLeft: 0,
      }),
    ).toBe(true);
  });

  it('should stop preventing default action on events', () => {
    // setup
    pressSpacebar(wrapper);
    wrapper.setProps({ isDragging: true });
    wrapper.setProps({
      isEnabled: false,
    });
    // validation
    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // test
    const mockEvent: MockEvent = createMockEvent();
    pressArrowDown(wrapper, mockEvent);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});

describe('cancelled elsewhere in the app mid drag', () => {
  it('should end a current drag without firing the onCancel callback', () => {
    // lift
    pressSpacebar(wrapper);
    wrapper.setProps({
      isDragging: true,
    });

    // cancelled mid drag
    wrapper.setProps({
      isDragging: false,
    });

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 0,
      }),
    ).toBe(true);

    // should have no impact
    const arrowDownMock: MockEvent = createMockEvent();
    pressArrowDown(wrapper, arrowDownMock);
    requestAnimationFrame.step();

    const arrowUpMock: MockEvent = createMockEvent();
    pressArrowUp(wrapper);
    requestAnimationFrame.step();

    const escapeEvent: KeyboardEvent = windowEscape();
    requestAnimationFrame.step();

    // being super safe
    requestAnimationFrame.flush();

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 0,
      }),
    ).toBe(true);
    expect(arrowDownMock.preventDefault).not.toHaveBeenCalled();
    expect(arrowUpMock.preventDefault).not.toHaveBeenCalled();
    expect(escapeEvent.defaultPrevented).toBe(false);
  });
});

it('should call the onCancel prop if unmounted mid drag', () => {
  pressSpacebar(wrapper);
  wrapper.setProps({ isDragging: true });

  wrapper.unmount();

  expect(
    callbacksCalled(callbacks)({
      onLift: 1,
      onCancel: 1,
    }),
  ).toBe(true);
});

describe('subsequent drags', () => {
  it('should be possible to do another drag after one finishes', () => {
    Array.from({ length: 10 }, (v, k) => k).forEach((val: number) => {
      // lift
      pressSpacebar(wrapper);
      // move forward
      pressArrowDown(wrapper);
      requestAnimationFrame.step();
      // drop
      pressSpacebar(wrapper);

      expect(
        callbacksCalled(callbacks)({
          onLift: val + 1,
          onMoveDown: val + 1,
          onDrop: val + 1,
        }),
      ).toBe(true);
    });
  });

  it('should allow drags after a cancel', () => {
    // cancelled drag
    pressSpacebar(wrapper);
    pressEscape(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onLift: 1,
        onCancel: 1,
      }),
    ).toBe(true);

    // lift and drop
    pressSpacebar(wrapper);
    pressSpacebar(wrapper);

    expect(
      callbacksCalled(callbacks)({
        onCancel: 1,
        onLift: 2,
        onDrop: 1,
      }),
    ).toBe(true);
  });
});
