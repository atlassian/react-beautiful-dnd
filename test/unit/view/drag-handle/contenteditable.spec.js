// @flow
import React from 'react';
import { mount } from 'enzyme';
import { forEach, type Control } from './util/controls';
import { createRef } from './util/wrappers';
import {
  getStubCallbacks,
  callbacksCalled,
  whereAnyCallbacksCalled,
} from './util/callbacks';
import DragHandle from '../../../../src/view/drag-handle/drag-handle';
import basicContext from './util/basic-context';
import type { DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';

const draggableId = 'draggable';

forEach((control: Control) => {
  beforeEach(() => {
    // using content editable in particular ways causes react logging
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });
  describe('interactive interactions are blocked', () => {
    it('should block the drag if the drag handle is itself contenteditable', () => {
      const callbacks = getStubCallbacks();
      const ref = createRef();
      const wrapper = mount(
        <DragHandle
          draggableId={draggableId}
          callbacks={callbacks}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={ref.getRef}
          canDragInteractiveElements={false}
          getShouldRespectForceTouch={() => true}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div {...dragHandleProps} contentEditable ref={ref.setRef} />
          )}
        </DragHandle>,
        { context: basicContext },
      );
      const target = wrapper.getDOMNode();
      const options = {
        target,
      };

      control.preLift(wrapper, options);
      control.lift(wrapper, options);
      control.drop(wrapper);

      expect(
        callbacksCalled(callbacks)({
          onLift: 0,
        }),
      ).toBe(true);

      wrapper.unmount();
    });

    it('should block the drag if originated from a child contenteditable', () => {
      const customCallbacks = getStubCallbacks();
      const ref = createRef();
      const customWrapper = mount(
        <DragHandle
          draggableId={draggableId}
          callbacks={customCallbacks}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={ref.getRef}
          canDragInteractiveElements={false}
          getShouldRespectForceTouch={() => true}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div {...dragHandleProps} ref={ref.setRef}>
              <div className="editable" contentEditable />
            </div>
          )}
        </DragHandle>,
        { context: basicContext },
      );
      const target = customWrapper.getDOMNode().querySelector('.editable');
      if (!target) {
        throw new Error('could not find editable element');
      }
      const options = {
        target,
      };

      control.preLift(customWrapper, options);
      control.lift(customWrapper, options);
      control.drop(customWrapper);

      expect(whereAnyCallbacksCalled(customCallbacks)).toBe(false);

      customWrapper.unmount();
    });

    it('should block the drag if originated from a child of a child contenteditable', () => {
      const customCallbacks = getStubCallbacks();
      const ref = createRef();
      const customWrapper = mount(
        <DragHandle
          draggableId={draggableId}
          callbacks={customCallbacks}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={ref.getRef}
          canDragInteractiveElements={false}
          getShouldRespectForceTouch={() => true}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div {...dragHandleProps} ref={ref.setRef}>
              <div className="editable" contentEditable>
                <p>hello there</p>
                <span className="target">Edit me!</span>
              </div>
            </div>
          )}
        </DragHandle>,
        { context: basicContext },
      );
      const target = customWrapper.getDOMNode().querySelector('.target');
      if (!target) {
        throw new Error('could not find the target');
      }
      const options = {
        target,
      };

      control.preLift(customWrapper, options);
      control.lift(customWrapper, options);
      control.drop(customWrapper);

      expect(
        callbacksCalled(customCallbacks)({
          onLift: 0,
        }),
      ).toBe(true);

      customWrapper.unmount();
    });

    it('should not block if contenteditable is set to false', () => {
      const customCallbacks = getStubCallbacks();
      const ref = createRef();
      const customWrapper = mount(
        <DragHandle
          draggableId={draggableId}
          callbacks={customCallbacks}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={ref.getRef}
          canDragInteractiveElements={false}
          getShouldRespectForceTouch={() => true}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div {...dragHandleProps} ref={ref.setRef}>
              <div className="editable" contentEditable={false}>
                <p>hello there</p>
                <span className="target">Edit me!</span>
              </div>
            </div>
          )}
        </DragHandle>,
        { context: basicContext },
      );
      const target = customWrapper.getDOMNode().querySelector('.target');
      if (!target) {
        throw new Error('could not find the target');
      }
      const options = {
        target,
      };

      control.preLift(customWrapper, options);
      control.lift(customWrapper, options);
      control.drop(customWrapper);

      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
          onDrop: 1,
        }),
      ).toBe(true);

      customWrapper.unmount();
    });
  });

  describe('interactive interactions are not blocked', () => {
    it('should not block the drag if the drag handle is contenteditable', () => {
      const customCallbacks = getStubCallbacks();
      const ref = createRef();
      const customWrapper = mount(
        <DragHandle
          draggableId={draggableId}
          callbacks={customCallbacks}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={ref.getRef}
          getShouldRespectForceTouch={() => true}
          // stating that we can drag
          canDragInteractiveElements
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div {...dragHandleProps} ref={ref.setRef}>
              <div className="editable" contentEditable />
            </div>
          )}
        </DragHandle>,
        { context: basicContext },
      );
      const target = customWrapper.getDOMNode().querySelector('.editable');
      if (!target) {
        throw new Error('could not find editable element');
      }
      const options = {
        target,
      };

      control.preLift(customWrapper, options);
      control.lift(customWrapper, options);
      control.drop(customWrapper);

      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
          onDrop: 1,
        }),
      ).toBe(true);

      customWrapper.unmount();
    });

    it('should not block the drag if originated from a child contenteditable', () => {
      const customCallbacks = getStubCallbacks();
      const ref = createRef();
      const customWrapper = mount(
        <DragHandle
          draggableId={draggableId}
          callbacks={customCallbacks}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={ref.getRef}
          getShouldRespectForceTouch={() => true}
          // stating that we can drag
          canDragInteractiveElements
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div {...dragHandleProps} ref={ref.setRef}>
              <div className="editable" contentEditable>
                <p>hello there</p>
                <span className="target">Edit me!</span>
              </div>
            </div>
          )}
        </DragHandle>,
        { context: basicContext },
      );
      const target = customWrapper.getDOMNode().querySelector('.target');
      if (!target) {
        throw new Error('could not find the target');
      }
      const options = {
        target,
      };

      control.preLift(customWrapper, options);
      control.lift(customWrapper, options);
      control.drop(customWrapper);

      expect(
        callbacksCalled(customCallbacks)({
          onLift: 1,
          onDrop: 1,
        }),
      ).toBe(true);

      customWrapper.unmount();
    });
  });
});
