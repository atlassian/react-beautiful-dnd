// @flow
import React from 'react';
import { fireEvent, render, createEvent } from 'react-testing-library';
import App, { type Item } from '../app';
import { touch, simpleLift } from '../controls';
import { forcePressThreshold } from '../../../../../src/view/use-sensor-marshal/sensors/use-touch-sensor';
import { isDragging } from '../util';

jest.useFakeTimers();

function getForceChange(force: number): Event {
  const event: Event = new Event('touchforcechange', {
    bubbles: true,
    cancelable: true,
  });
  // $FlowFixMe - being amazing
  event.touches = [
    {
      clientX: 0,
      clientY: 0,
      force,
    },
  ];
  return event;
}

describe('force press not respected (default)', () => {
  it('should abort the force press when a force press is not respected', () => {
    const { getByText } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    touch.preLift(handle);

    const first: Event = getForceChange(forcePressThreshold);
    fireEvent(handle, first);
    expect(first.defaultPrevented).toBe(true);

    touch.lift(handle);

    const second: Event = getForceChange(forcePressThreshold);
    fireEvent(handle, second);
    expect(second.defaultPrevented).toBe(true);

    // force presses did not abort the pending or actual drag
    expect(isDragging(handle)).toBe(true);
  });
});

describe('force press respected', () => {
  const items: Item[] = [{ id: '0', shouldRespectForcePress: true }];

  it('should cancel a pending drag if a force press is registered', () => {
    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    touch.preLift(handle);

    // indirect cancel so event is not consumed
    const press: Event = getForceChange(forcePressThreshold);
    fireEvent(handle, press);
    expect(press.defaultPrevented).toBe(false);

    touch.lift(handle);

    expect(isDragging(handle)).toBe(false);
  });

  it('should cancel a drag if a force press is registered', () => {
    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(touch, handle);

    // indirect cancel so event is not consumed
    const press: Event = getForceChange(forcePressThreshold);
    fireEvent(handle, press);
    expect(press.defaultPrevented).toBe(false);

    // drag is no more
    expect(isDragging(handle)).toBe(false);
  });

  it('should abort a force press if dragging and some movement has occurred', () => {
    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(touch, handle);

    fireEvent.touchMove(handle, { touches: [{ clientX: 0, clientY: 0 }] });

    // consuming event and not cancelling after movement
    const press: Event = getForceChange(forcePressThreshold);
    fireEvent(handle, press);
    expect(press.defaultPrevented).toBe(true);

    expect(isDragging(handle)).toBe(true);
  });
});
