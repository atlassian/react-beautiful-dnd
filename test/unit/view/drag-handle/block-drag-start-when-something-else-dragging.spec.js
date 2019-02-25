// @flow
import React from 'react';
import { mount } from 'enzyme';
import DragHandle from '../../../../src/view/drag-handle/drag-handle';
import type { DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';
import { forEach, type Control } from './util/controls';
import { getStubCallbacks, callbacksCalled } from './util/callbacks';
import basicContext from './util/basic-context';
import { Child, createRef } from './util/wrappers';
import { canLiftKey } from '../../../../src/view/context-keys';

forEach((control: Control) => {
  it('should not start a drag if something else is already dragging in the system', () => {
    const ref = createRef();
    // faking a 'false' response
    const canLift = jest.fn().mockImplementation(() => false);
    const customContext = {
      ...basicContext,
      [canLiftKey]: canLift,
    };
    const customCallbacks = getStubCallbacks();
    const wrapper = mount(
      <DragHandle
        draggableId="my-draggable"
        callbacks={customCallbacks}
        isDragging={false}
        isDropAnimating={false}
        isEnabled
        getDraggableRef={ref.getRef}
        canDragInteractiveElements={false}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          <Child dragHandleProps={dragHandleProps} innerRef={ref.setRef} />
        )}
      </DragHandle>,
      { context: customContext },
    );

    control.preLift(wrapper);
    control.lift(wrapper);
    control.drop(wrapper);

    expect(
      callbacksCalled(customCallbacks)({
        onLift: 0,
      }),
    ).toBe(true);
    expect(canLift).toHaveBeenCalledWith('my-draggable');
  });
});
