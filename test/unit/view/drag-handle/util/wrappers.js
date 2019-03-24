// @flow
import React, { type Node } from 'react';
import { mount, type ReactWrapper } from 'enzyme';
import useDragHandle from '../../../../../src/view/use-drag-handle';
import type {
  Args,
  Callbacks,
  DragHandleProps,
} from '../../../../../src/view/use-drag-handle/drag-handle-types';
import basicContext from './app-context';
import AppContext, {
  type AppContextValue,
} from '../../../../../src/view/context/app-context';

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

type WithDragHandleProps = {|
  ...Args,
  children: (value: ?DragHandleProps) => Node | null,
|};

function WithDragHandle(props: WithDragHandleProps) {
  // strip the children prop out
  const { children, ...args } = props;
  const result: ?DragHandleProps = useDragHandle(args);
  return props.children(result);
}

export const getWrapper = (
  callbacks: Callbacks,
  appContext?: AppContextValue = basicContext,
  shouldRespectForceTouch?: boolean = true,
): ReactWrapper<*> => {
  const ref = createRef();

  return mount(
    <AppContext.Provider value={appContext}>
      <WithDragHandle
        draggableId="draggable"
        callbacks={callbacks}
        isDragging={false}
        isDropAnimating={false}
        isEnabled
        getDraggableRef={ref.getRef}
        canDragInteractiveElements={false}
        getShouldRespectForceTouch={() => shouldRespectForceTouch}
      >
        {(dragHandleProps: ?DragHandleProps) => (
          <Child dragHandleProps={dragHandleProps} innerRef={ref.setRef} />
        )}
      </WithDragHandle>
    </AppContext.Provider>,
  );
};
