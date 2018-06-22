// @flow
import React from 'react';
import { type Position } from 'css-box-model';
import { mount } from 'enzyme';
import Moveable from '../../../src/view/moveable/';
import type { Speed } from '../../../src/view/moveable/moveable-types';

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
      onMoveEnd={() => { }}
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

it('should move to the provided destination', () => {
  const destination: Position = {
    x: 100,
    y: 200,
  };

  moveTo(destination);

  expect(childFn).toHaveBeenCalledWith(destination);
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

  childFn.mockClear();
  wrapper.setProps({
    speed: 'INSTANT',
    destination,
    onMoveEnd: myMock,
  });

  expect(childFn).toHaveBeenCalledTimes(1);
  expect(childFn).toHaveBeenCalledWith(destination);

  // React motion is lame
  requestAnimationFrame.flush();
  expect(childFn).toHaveBeenCalledTimes(2);
  expect(childFn).toHaveBeenCalledWith(destination);

  // but at least the result should be memoized
  expect(childFn.mock.calls[0][0]).toBe(childFn.mock.calls[1][0]);
});

it('should allow multiple movements', () => {
  const positions: Array<Position> = [
    { x: 100, y: 100 },
    { x: 400, y: 200 },
    { x: 10, y: -20 },
  ];

  positions.forEach((position: Position) => {
    moveTo(position);

    expect(childFn).toBeCalledWith(position);
  });
});

it('should return no movement if the item is at the origin', () => {
  moveTo({ x: 0, y: 0 });

  expect(childFn).toHaveBeenCalledWith({ x: 0, y: 0 });
});
