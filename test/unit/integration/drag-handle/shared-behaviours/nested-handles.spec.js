// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { forEachSensor, type Control, simpleLift } from '../controls';
import { isDragging } from '../util';
import Board from '../board';

forEachSensor((control: Control) => {
  it('should not start a drag on a parent if a child drag handle has already received the event', () => {
    const { getByTestId } = render(<Board />);
    const cardHandle: HTMLElement = getByTestId('card-0');
    const columnHandle: HTMLElement = getByTestId('column-0');

    simpleLift(control, cardHandle);

    expect(isDragging(cardHandle)).toBe(true);
    expect(isDragging(columnHandle)).toBe(false);
  });

  it('should start a drag on a pare~nt the event is trigged on the parent', () => {
    const { getByTestId } = render(<Board />);
    const cardHandle: HTMLElement = getByTestId('card-0');
    const columnHandle: HTMLElement = getByTestId('column-0');

    simpleLift(control, columnHandle);

    expect(isDragging(columnHandle)).toBe(true);
    expect(isDragging(cardHandle)).toBe(false);
  });
});
