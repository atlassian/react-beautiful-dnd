// @flow
import React from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import { forEach, type Control } from './util/controls';
import { getStubCallbacks } from './util/callbacks';
import basicContext from './util/app-context';
import type {
  Callbacks,
  DragHandleProps,
} from '../../../../src/view/use-drag-handle/drag-handle-types';
import { createRef, Child, WithDragHandle } from './util/wrappers';
import AppContext from '../../../../src/view/context/app-context';

const getNestedWrapper = (
  parentCallbacks: Callbacks,
  childCallbacks: Callbacks,
): ReactWrapper<*> => {
  const parent = createRef();
  const inner = createRef();

  return mount(
    <AppContext.Provider value={basicContext}>
      <WithDragHandle
        draggableId="parent"
        callbacks={parentCallbacks}
        isDragging={false}
        isDropAnimating={false}
        isEnabled
        getDraggableRef={parent.getRef}
        getShouldRespectForceTouch={() => true}
        canDragInteractiveElements={false}
      >
        {(parentProps: ?DragHandleProps) => (
          <Child
            dragHandleProps={parentProps}
            className="parent drag-handle"
            innerRef={parent.setRef}
          >
            <WithDragHandle
              draggableId="child"
              callbacks={childCallbacks}
              isDragging={false}
              isDropAnimating={false}
              isEnabled
              getDraggableRef={inner.getRef}
              canDragInteractiveElements={false}
              getShouldRespectForceTouch={() => true}
            >
              {(childProps: ?DragHandleProps) => (
                <Child
                  dragHandleProps={childProps}
                  className="child drag-handle"
                  innerRef={inner.setRef}
                >
                  Child!
                </Child>
              )}
            </WithDragHandle>
          </Child>
        )}
      </WithDragHandle>
    </AppContext.Provider>,
  );
};

forEach((control: Control) => {
  it('should not start a drag on a parent if a child drag handle has already received the event', () => {
    const parentCallbacks = getStubCallbacks();
    const childCallbacks = getStubCallbacks();
    const nested: ReactWrapper<*> = getNestedWrapper(
      parentCallbacks,
      childCallbacks,
    );
    const child: ReactWrapper<*> = nested.find('.child').first();

    // React enzyme will bubble events within a wrapper
    control.preLift(child);
    control.lift(child);

    expect(childCallbacks.onLift).toHaveBeenCalled();
    expect(parentCallbacks.onLift).not.toHaveBeenCalled();

    control.drop(child);
    nested.unmount();
  });

  it('should start a drag on a parent the event is trigged on the parent', () => {
    const parentCallbacks = getStubCallbacks();
    const childCallbacks = getStubCallbacks();
    const nested: ReactWrapper<*> = getNestedWrapper(
      parentCallbacks,
      childCallbacks,
    );
    const parent: ReactWrapper<*> = nested.find('.parent').first();

    control.preLift(parent);
    control.lift(parent);

    expect(childCallbacks.onLift).not.toHaveBeenCalled();
    expect(parentCallbacks.onLift).toHaveBeenCalled();

    control.drop(parent);
    nested.unmount();
  });
});
