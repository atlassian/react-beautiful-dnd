// @flow
import React, { useRef } from 'react';
import invariant from 'tiny-invariant';
import { render } from '@testing-library/react';
import * as keyCodes from '../../../../src/view/key-codes';
import type {
  Provided as DraggableProvided,
  StateSnapshot as DraggableStateSnapshot,
} from '../../../../src/view/draggable/draggable-types';
import { withPoorDimensionMocks, isDragging } from '../util/helpers';
import App from '../util/app';
import { simpleLift, mouse } from '../util/controls';

type Props = {|
  item: Item,
  provided: DraggableProvided,
  snapshot: DraggableStateSnapshot,
  throwFn: () => void,
|};

class WillThrow extends React.Component<Props> {
  componentDidUpdate(previous: Props) {
    if (!previous.snapshot.isDragging && this.props.snapshot.isDragging) {
      console.log('throwing on drag start');
      this.props.throwFn();
    }
  }
  render() {
    console.log(
      'rendering will throw. is dragging?',
      this.props.snapshot.isDragging,
    );
    return (
      <div
        {...this.props.provided.draggableProps}
        {...this.props.provided.dragHandleProps}
        data-is-dragging={this.props.snapshot.isDragging}
        data-testid={this.props.item.id}
        ref={this.props.provided.innerRef}
      >
        Drag me
      </div>
    );
  }
}

let warn;
let error;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  error = jest.spyOn(console, 'error');
});

afterEach(() => {
  // cleanup
  warn.mockRestore();
  error.mockRestore();
});

// causing an infinite loop
it.only('should reset the application state and swallow the exception if an invariant exception occurs', () => {
  withPoorDimensionMocks(() => {
    const renderItem = (item: Item) => (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => (
      <WillThrow
        throwFn={() => invariant(false)}
        item={item}
        provided={provided}
        snapshot={snapshot}
      />
    );

    const { getByTestId } = render(<App renderItem={renderItem} />);
    const handle: HTMLElement = getByTestId('0');
    expect(error).not.toHaveBeenCalled();

    simpleLift(mouse, handle);

    expect(error).toHaveBeenCalled();
    expect(isDragging(handle)).toBe(false);
  });

  // // Execute a lift which will throw an error
  // // throw is swallowed
  // wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space });
  // // Message printed
  // expect(console.error).toHaveBeenCalled();

  // // WillThrough can still be found in the DOM
  // const willThrough: ReactWrapper<*> = wrapper.find(WillThrow);
  // expect(willThrough.length).toBeTruthy();
  // // no longer dragging
  // expect(willThrough.props().snapshot).toEqual(whenIdle);
});

it('should not reset the application state an exception occurs and throw it', () => {
  const wrapper: ReactWrapper<*> = withThrow(() => {
    throw new Error('YOLO');
  });
  // Execute a lift which will throw an error
  // throw is NOT swallowed
  // expect(() =>
  // wrapper.find(WillThrow).simulate('keydown', { keyCode: keyCodes.space });
  // ).toThrow();
  // Messages printed
  // expect(console.error).toHaveBeenCalled();
  // const willThrough: ReactWrapper<*> = wrapper.find(WillThrow);
  // expect(willThrough.length).toBeTruthy();
  // // no longer dragging
  // expect(willThrough.props().snapshot).toEqual(whenIdle);
});

it('should recover from an error on mount', () => {
  function ThrowOnce() {
    const isFirstRenderRef = useRef(true);

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      invariant(false, 'error on first render');
    }
    return null;
  }
  // This is lame. enzyme is bubbling up errors that where caught in componentDidCatch to the window
  expect(() =>
    mount(
      <DragDropContext onDragEnd={() => {}}>
        <ThrowOnce />
      </DragDropContext>,
    ),
  ).toThrow();
});
