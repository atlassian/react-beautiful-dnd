// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { forEachSensor, type Control, simpleLift } from '../../util/controls';
import { isDragging } from '../../util/helpers';
import {
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '../../../../../src';
import App, { type Item } from '../../util/app';

forEachSensor((control: Control) => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    // $ExpectError - mock
    console.error.mockRestore();
  });

  it('should block the drag if the drag handle is itself data-interactive-element', () => {
    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        data-is-dragging={snapshot.isDragging}
        data-testid={item.id}
        data-interactive-element
      />
    );

    const { getByTestId } = render(<App renderItem={renderItem} />);
    const handle: HTMLElement = getByTestId('0');

    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(false);
  });

  it('should block the drag if originated from a child data-interactive-element', () => {
    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        data-is-dragging={snapshot.isDragging}
        data-testid={`handle-${item.id}`}
      >
        <div data-testid={`inner-${item.id}`} data-interactive-element />
      </div>
    );

    const { getByTestId } = render(<App renderItem={renderItem} />);
    const inner: HTMLElement = getByTestId('inner-0');
    const handle: HTMLElement = getByTestId('handle-0');

    simpleLift(control, inner);

    expect(isDragging(handle)).toBe(false);
  });

  it('should block the drag if originated from a child of a child data-interactive-element', () => {
    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        data-is-dragging={snapshot.isDragging}
        data-testid={`handle-${item.id}`}
      >
        <div data-interactive-element>
          <p>hello there</p>
          <span data-testid={`inner-${item.id}`}>Edit me!</span>
        </div>
      </div>
    );

    const { getByTestId } = render(<App renderItem={renderItem} />);
    const inner: HTMLElement = getByTestId('inner-0');
    const handle: HTMLElement = getByTestId('handle-0');

    simpleLift(control, inner);

    expect(isDragging(handle)).toBe(false);
  });

  it('should not block if data-interactive-element is set to false', () => {
    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        data-is-dragging={snapshot.isDragging}
        data-testid={item.id}
        data-interactive-element={false}
      />
    );

    const { getByTestId } = render(<App renderItem={renderItem} />);
    const handle: HTMLElement = getByTestId('0');

    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(true);
  });

  it('should not block a drag if dragging interactive elements is allowed', () => {
    const items: Item[] = [{ id: '0', canDragInteractiveElements: true }];

    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        data-is-dragging={snapshot.isDragging}
        data-testid={item.id}
        data-interactive-element
      />
    );

    const { getByTestId } = render(
      <App items={items} renderItem={renderItem} />,
    );
    const handle: HTMLElement = getByTestId('0');

    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(true);
  });
});
