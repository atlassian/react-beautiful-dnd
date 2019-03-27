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
        className={this.props.className || 'drag-handle'}
      >
        Drag me!
        {this.props.children}
      </div>
    );
  }
}

type WithDragHandleProps = {|
  ...Args,
  children: (value: ?DragHandleProps) => Node | null,
|};

export function WithDragHandle(props: WithDragHandleProps) {
  // strip the children prop out
  const { children, ...args } = props;
  const result: ?DragHandleProps = useDragHandle(args);
  return props.children(result);
}

export class PassThrough extends React.Component<*> {
  render() {
    const { children, ...rest } = this.props;
    return children(rest);
  }
}

export const getWrapper = (
  callbacks: Callbacks,
  appContext?: AppContextValue = basicContext,
  shouldRespectForceTouch?: boolean = true,
): ReactWrapper<*> => {
  const ref = createRef();

  // stopping this from creating a new reference and breaking the memoization during a drag
  const getShouldRespectForceTouch = () => shouldRespectForceTouch;

  return mount(
    <PassThrough>
      {(outer: any) => (
        <AppContext.Provider value={appContext}>
          <WithDragHandle
            draggableId="my-draggable"
            callbacks={callbacks}
            isDragging={false}
            isDropAnimating={false}
            isEnabled
            getDraggableRef={ref.getRef}
            canDragInteractiveElements={false}
            getShouldRespectForceTouch={getShouldRespectForceTouch}
            {...outer}
          >
            {(dragHandleProps: ?DragHandleProps) => (
              <Child dragHandleProps={dragHandleProps} innerRef={ref.setRef} />
            )}
          </WithDragHandle>
        </AppContext.Provider>
      )}
    </PassThrough>,
  );
};
