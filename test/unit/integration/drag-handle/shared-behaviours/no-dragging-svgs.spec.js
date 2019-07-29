// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { forEachSensor, type Control, simpleLift } from '../controls';
import { isDragging } from '../util';
import {
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '../../../../../src';
import App, { type Item } from '../app';

forEachSensor((control: Control) => {
  it('should not start a drag from an SVG', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
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
    expect(warn).toHaveBeenCalledTimes(0);

    simpleLift(control, handle);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(isDragging(draggable)).toBe(false);

    warn.mockRestore();
  });
});
