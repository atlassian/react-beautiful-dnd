// @flow
import React, { type Node } from 'react';
import invariant from 'tiny-invariant';
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

// export const createDraggableRef = () => {
//   const ref: HTMLElement = document.createElement('div');
//   const setChildRef = (() => {
//     let applied: ?HTMLElement = null;

//     return (child: ?HTMLElement) => {
//       if (!child) {
//         return;
//       }

//       if (applied && child !== applied) {
//         invariant(false, 'Trying to change ref of drag handle');
//       }

//       applied = child;
//       ref.appendChild(applied);
//     };
//   })();

//   const getRef = () => ref;

//   return { ref, getRef, setChildRef };
// };

export const createRef = () => {
  let ref: ?HTMLElement = null;

  const setRef = (supplied: ?HTMLElement) => {
    ref = supplied;
  };

  const getRef = (): ?HTMLElement => ref;

  return { ref, setRef, getRef };
};

// class App extends React.Component<*> {
//   ref: ?HTMLElement = null;

//   setRef = (ref: ?HTMLElement) => {
//     if (ref == null) {
//       return;
//     }
//     console.log('setting ref', ref);
//     this.ref = ref;
//   };
//   getRef = (): ?HTMLElement => this.ref;

//   render() {
//     return (
//         <DragHandle
//           draggableId="draggable"
//           callbacks={this.props.callbacks}
//           isDragging={false}
//           isDropAnimating={false}
//           getDraggableRef={this.getRef}
//           isEnabled
//           canDragInteractiveElements={false}
//         >
//         {(dragHandleProps: ?DragHandleProps) => (
//           <Child dragHandleProps={dragHandleProps} />
//         )}
//       </div>
//     );
//   }
// }

export const getWrapper = (
  callbacks: Callbacks,
  context?: Object = basicContext,
): ReactWrapper => {
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
    >
      {(dragHandleProps: ?DragHandleProps) => (
        <Child dragHandleProps={dragHandleProps} innerRef={ref.setRef} />
      )}
    </DragHandle>,
    { context },
  );
};
