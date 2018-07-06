// @flow
import React from 'react';
import { mount } from 'enzyme';
import DragHandle from '../../../../src/view/drag-handle/drag-handle';
import type { DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';
import {
  styleContextKey,
  canLiftContextKey,
} from '../../../../src/view/context-keys';
import { getStubCallbacks } from './util';

const basicContext = {
  [styleContextKey]: 'hello',
  [canLiftContextKey]: () => true,
};

const draggableRef: HTMLElement = document.createElement('div');

const setChildRef = (ref: ?Element) => {
  if (!ref) {
    return;
  }
  draggableRef.appendChild(ref);
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

it('should throw if a help SVG message if the drag handle is a SVG', () => {
  const execute = () =>
    mount(
      <DragHandle
        draggableId="parent"
        callbacks={getStubCallbacks()}
        isDragging={false}
        isDropAnimating={false}
        isEnabled
        getDraggableRef={() => draggableRef}
        canDragInteractiveElements={false}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          <svg ref={setChildRef} {...dragHandleProps} />
        )}
      </DragHandle>,
      { context: basicContext },
    );

  expect(execute).toThrow('A drag handle cannot be an SVGElement');
});
