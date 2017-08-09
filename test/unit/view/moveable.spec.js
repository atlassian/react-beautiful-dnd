// @flow
import React from 'react';
import { mount } from 'enzyme';
import Moveable from '../../../src/view/moveable/';
import type { Position } from '../../../src/types';
// eslint-disable-next-line no-duplicate-imports
import type { Speed, Style } from '../../../src/view/moveable/';

describe('Moveable', () => {
  let wrapper;
  let childFn;

  beforeAll(() => { // eslint-disable-line no-undef
    requestAnimationFrame.reset();
    childFn = jest.fn(() => <div>hi there</div>);
  });

  beforeEach(() => {
    jest.useFakeTimers();
    wrapper = mount(
      <Moveable
        speed="STANDARD"
      >
        {childFn}
      </Moveable>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    requestAnimationFrame.reset();
  });

  const moveTo = (point: Position, speed?: Speed = 'STANDARD', onMoveEnd?: () => void) => {
    wrapper.setProps({
      destination: point,
      onMoveEnd,
      speed,
    });

    // flush the animation
    requestAnimationFrame.flush();

    // callback is called on the next tick after
    // the animation is finished.
    jest.runOnlyPendingTimers();
  };

  const getStyle = (point: Position) => {
    const style: Style = {
      transform: `translate(${point.x}px, ${point.y}px)`,
    };
    return style;
  };

  it('should move to the provided destination', () => {
    const destination: Position = {
      x: 100,
      y: 200,
    };

    moveTo(destination);

    expect(childFn).toHaveBeenCalledWith(getStyle(destination));
  });

  it('should call onMoveEnd when the movement is finished', () => {
    const myMock = jest.fn();
    const destination: Position = {
      x: 100,
      y: 200,
    };

    moveTo(destination, 'STANDARD', myMock);

    expect(myMock).toHaveBeenCalled();
  });

  it('should move instantly if required', () => {
    const myMock = jest.fn();
    const destination: Position = {
      x: 100,
      y: 200,
    };

    // Only releasing one frame
    // ReactMotion uses this to trigger the initial animation
    requestAnimationFrame.step();

    wrapper.setProps({
      speed: 'INSTANT',
      destination,
      onMoveEnd: myMock,
    });

    // Only releasing one frame
    requestAnimationFrame.flush();

    // onMoveEnd fired after a tick
    jest.runOnlyPendingTimers();

    expect(childFn).toHaveBeenCalledWith(getStyle(destination));
    expect(myMock).toHaveBeenCalled();
  });

  it('should allow multiple movements', () => {
    const positions: Array<Position> = [
      { x: 100, y: 100 },
      { x: 400, y: 200 },
      { x: 10, y: -20 },
    ];

    positions.forEach((position: Position) => {
      moveTo(position);

      expect(childFn).toBeCalledWith(getStyle(position));
    });
  });

  it('should return no movement if the item is at the origin', () => {
    const expected: Style = {
      transform: null,
    };

    moveTo({ x: 0, y: 0 });

    expect(childFn).toHaveBeenCalledWith(expected);
  });
});
