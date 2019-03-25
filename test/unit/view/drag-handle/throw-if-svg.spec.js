// @flow
import React from 'react';
import { mount } from 'enzyme';
import type { DragHandleProps } from '../../../../src/view/use-drag-handle/drag-handle-types';
import { getStubCallbacks } from './util/callbacks';
import { WithDragHandle, createRef } from './util/wrappers';
import AppContext from '../../../../src/view/context/app-context';
import basicContext from './util/app-context';

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
      <AppContext.Provider value={basicContext}>
        <WithDragHandle
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
        </WithDragHandle>
      </AppContext.Provider>,
    );
  };

  expect(execute).toThrow('A drag handle cannot be an SVGElement');
});
