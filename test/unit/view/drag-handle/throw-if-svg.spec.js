// @flow
import React from 'react';
import { mount } from 'enzyme';
import DragHandle from '../../../../src/view/drag-handle/drag-handle';
import type { DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';
import { styleKey, canLiftKey } from '../../../../src/view/context-keys';
import { getStubCallbacks } from './util/callbacks';
import { createRef } from './util/wrappers';

const basicContext = {
  [styleKey]: 'hello',
  [canLiftKey]: () => true,
};

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

it('should throw if a help SVG message if the drag handle is a SVG', () => {
  const execute = () => {
    const ref = createRef();

    return mount(
      <DragHandle
        draggableId="parent"
        callbacks={getStubCallbacks()}
        isDragging={false}
        isDropAnimating={false}
        isEnabled
        getDraggableRef={ref.getRef}
        canDragInteractiveElements={false}
        getShouldRespectForceTouch={() => true}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          // $ExpectError - this fails the flow check! Success!
          <svg {...dragHandleProps} ref={ref.setRef} />
        )}
      </DragHandle>,
      { context: basicContext },
    );
  };

  expect(execute).toThrow('A drag handle cannot be an SVGElement');
});
