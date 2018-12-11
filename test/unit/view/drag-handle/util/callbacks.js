// @flow
import type { Callbacks } from '../../../../../src/view/drag-handle/drag-handle-types';

export const getStubCallbacks = (): Callbacks => ({
  onLift: jest.fn(),
  onMove: jest.fn(),
  onMoveUp: jest.fn(),
  onMoveDown: jest.fn(),
  onMoveRight: jest.fn(),
  onMoveLeft: jest.fn(),
  onDrop: jest.fn(),
  onCancel: jest.fn(),
  onWindowScroll: jest.fn(),
});

export const resetCallbacks = (callbacks: Callbacks) => {
  Object.keys(callbacks).forEach((key: string) => {
    callbacks[key].mockReset();
  });
};

type CallBacksCalledFn = {|
  onLift?: number,
  onMove?: number,
  onMoveUp?: number,
  onMoveDown?: number,
  onMoveRight?: number,
  onMoveLeft?: number,
  onDrop?: number,
  onCancel?: number,
  onWindowScroll?: number,
|};

export const callbacksCalled = (callbacks: Callbacks) => ({
  onLift = 0,
  onMove = 0,
  onMoveUp = 0,
  onMoveDown = 0,
  onMoveRight = 0,
  onMoveLeft = 0,
  onDrop = 0,
  onCancel = 0,
}: CallBacksCalledFn = {}) =>
  callbacks.onLift.mock.calls.length === onLift &&
  callbacks.onMove.mock.calls.length === onMove &&
  callbacks.onMoveUp.mock.calls.length === onMoveUp &&
  callbacks.onMoveDown.mock.calls.length === onMoveDown &&
  callbacks.onDrop.mock.calls.length === onDrop &&
  callbacks.onCancel.mock.calls.length === onCancel &&
  callbacks.onMoveRight.mock.calls.length === onMoveRight &&
  callbacks.onMoveLeft.mock.calls.length === onMoveLeft;

export const whereAnyCallbacksCalled = (callbacks: Callbacks) =>
  !callbacksCalled(callbacks)();

// useful debug function
// eslint-disable-next-line no-unused-vars
export const getCallbackCalls = (callbacks: Callbacks) =>
  Object.keys(callbacks).reduce(
    (previous: Object, key: string) => ({
      ...previous,
      [key]: callbacks[key].mock.calls.length,
    }),
    {},
  );
