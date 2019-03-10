// @flow
import React, { type Node } from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import DragHandle from '../../../../../src/view/drag-handle/drag-handle';
import type {
  Callbacks,
  DragHandleProps,
} from '../../../../../src/view/drag-handle/drag-handle-types';
import basicContext from './basic-context';

type ChildProps = {|
  dragHandleProps: ?DragHandleProps,
  className?: string,
  children?: Node,
  innerRef?: (ref: ?HTMLElement) => void,
|};

export class Child extends React.Component<ChildProps> {
  render() {
    return (
      <div
        ref={this.props.innerRef}
        {...this.props.dragHandleProps}
        className={this.props.className || 'child'}
      >
        Drag me!
        {this.props.children}
      </div>
    );
  }
}

export const createRef = () => {
  let ref: ?HTMLElement = null;

  const setRef = (supplied: ?HTMLElement) => {
    ref = supplied;
  };

  const getRef = (): ?HTMLElement => ref;

  return { ref, setRef, getRef };
};

export const getWrapper = (
  callbacks: Callbacks,
  context?: Object = basicContext,
): ReactWrapper<*> => {
  const ref = createRef();

  return mount(
    <DragHandle
      draggableId="draggable"
      callbacks={callbacks}
      isDragging={false}
      isDropAnimating={false}
      isEnabled
      getDraggableRef={ref.getRef}
      canDragInteractiveElements={false}
      getShouldRespectForceTouch={() => true}
    >
      {(dragHandleProps: ?DragHandleProps) => (
        <Child dragHandleProps={dragHandleProps} innerRef={ref.setRef} />
      )}
    </DragHandle>,
    { context },
  );
};
