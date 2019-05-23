// @flow
import invariant from 'tiny-invariant';
import React, { useEffect, useState, useRef } from 'react';
import { act } from 'react-dom/test-utils';
import { render, fireEvent } from 'react-testing-library';
import { isDragging, getOffset } from '../util';
import App from '../app';
import { simpleLift } from './util';

jest.useFakeTimers();

it('should abort a drag if instructed', () => {
  function Throw() {
    const shouldThrowRef = useRef(false);
    const [, setShouldThrow] = useState(false);

    if (shouldThrowRef.current) {
      shouldThrowRef.current = false;
      // throw new Error('yolo');
      invariant(false, 'throwing');
    }

    useEffect(() => {
      // trigger re-render so we can throw during render pass
      setTimeout(() => {
        shouldThrowRef.current = true;
        setShouldThrow(true);
      });
    }, []);
    console.log('rendered. should throw:', shouldThrowRef.current);
    return null;
  }
  const { getByText } = render(<App anotherChild={<Throw />} />);

  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  // fast forward fake timer - will throw
  act(() => {
    jest.runOnlyPendingTimers();
  });
  // no longer dragging - recovered from error
  const newHandle: HTMLElement = getByText('item: 0');
  // handle is a new element
  expect(newHandle).not.toBe(handle);
  expect(isDragging(newHandle)).toBe(false);

  expect(() => {
    // trying to move the mounted and unmounted handles
    fireEvent.mouseMove(handle, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(newHandle, { clientX: 100, clientY: 100 });
    // flush frames which would cause movement
    requestAnimationFrame.flush();
  }).not.toThrow();

  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });
  expect(getOffset(newHandle)).toEqual({ x: 0, y: 0 });
});
