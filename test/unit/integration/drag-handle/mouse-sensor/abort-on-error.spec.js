// @flow
import invariant from 'tiny-invariant';
import React, { useEffect, useState, useRef } from 'react';
import { render, act, createEvent } from 'react-testing-library';
import { isDragging, getOffset } from '../util';
import { simpleLift } from './util';
import App from '../app';
import { noop } from '../../../../../src/empty';

jest.useFakeTimers();
jest.spyOn(console, 'error').mockImplementation(noop);

type Props = {
  throw: () => void,
};

function Vomit(props: Props) {
  const setShouldThrow = useState(false)[1];
  const shouldThrowRef = useRef(false);

  useEffect(() => {
    setTimeout(() => {
      shouldThrowRef.current = true;
      setShouldThrow(true);
    });
  }, [setShouldThrow]);

  if (shouldThrowRef.current) {
    shouldThrowRef.current = false;
    props.throw();
  }

  return null;
}

it('should abort a drag if an invariant error occurs in the application', () => {
  const { getByText } = render(
    <App
      anotherChild={
        <Vomit
          throw={() => invariant(false, 'Do not pass go, do not collect $200')}
        />
      }
    />,
  );
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  act(() => {
    jest.runOnlyPendingTimers();
  });

  const newHandle: HTMLElement = getByText('item: 0');
  // handle is now a new element
  expect(handle).not.toBe(newHandle);
  expect(isDragging(newHandle)).toBe(false);

  // moving the handles around
  expect(() => {
    createEvent.mouseMove(handle, { clientX: 100, clientY: 100 });
    createEvent.mouseMove(newHandle, { clientX: 100, clientY: 100 });
  }).not.toThrow();

  // would normally release any movements
  requestAnimationFrame.flush();

  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });
  expect(getOffset(newHandle)).toEqual({ x: 0, y: 0 });
});

it('should abort a drag if an a non-invariant error occurs in the application', () => {
  const { getByText, queryByText } = render(
    <App
      anotherChild={
        <Vomit
          throw={() => {
            throw new Error('Raw error throw');
          }}
        />
      }
    />,
  );
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  expect(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }).toThrow();

  // handle is gone
  expect(queryByText('item: 0')).toBe(null);

  // strange - but firing events on old handle
  expect(() => {
    act(() => {
      createEvent.mouseMove(handle, { clientX: 100, clientY: 100 });
      // would normally release any movements
      requestAnimationFrame.flush();

      expect(getOffset(handle)).toEqual({ x: 0, y: 0 });
    });
  }).not.toThrow();
});
