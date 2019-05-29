// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { forEachSensor, type Control, simpleLift } from '../controls';
import { isDragging } from '../util';
import {
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '../../../../../src';
import App, { type Item } from '../app';

forEachSensor((control: Control) => {
  it('should not start a drag from an SVG', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        data-is-dragging={snapshot.isDragging}
        data-testid={`draggable-${item.id}`}
      >
        <svg {...provided.dragHandleProps} data-testid={`handle-${item.id}`} />
      </div>
    );
    const { getByTestId } = render(<App renderItem={renderItem} />);
    const draggable = getByTestId('draggable-0');
    const handle = getByTestId('handle-0');
    expect(console.warn).toHaveBeenCalledTimes(0);

    simpleLift(control, handle);

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(isDragging(draggable)).toBe(false);

    console.warn.mockRestore();
  });
});
