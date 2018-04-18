// @flow
import React from 'react';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import DragHandle from '../../../../src/view/drag-handle';
import { styleContextKey, canLiftContextKey } from '../../../../src/view/context-keys';
import forceUpdate from '../../../utils/force-update';
import type { Callbacks, DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';

const getStubCallbacks = (): Callbacks => ({
  onLift: jest.fn(),
  onMove: jest.fn(),
  onMoveForward: jest.fn(),
  onMoveBackward: jest.fn(),
  onCrossAxisMoveForward: jest.fn(),
  onCrossAxisMoveBackward: jest.fn(),
  onDrop: jest.fn(),
  onCancel: jest.fn(),
  onWindowScroll: jest.fn(),
});

type ChildProps = {|
  dragHandleProps: ?DragHandleProps
|}

class Child extends React.Component<ChildProps> {
  render() {
    return (
      <div {...this.props.dragHandleProps}>
        Drag me!
      </div>
    );
  }
}

const basicContext = {
  [styleContextKey]: 'hello',
  [canLiftContextKey]: () => true,
};

const body: ?HTMLElement = document.body;

if (!body) {
  throw new Error('document.body not found');
}

const first: HTMLElement = document.createElement('div');
first.setAttribute('id', 'first');
body.appendChild(first);
const second: HTMLElement = document.createElement('div');
second.setAttribute('id', 'second');
body.appendChild(second);

describe('ref changes (dragging in a portal)', () => {
  it('should retain focus if draggable ref is changing and had focus', () => {
    // setting our active element to be the first
    let dragHandleRef: HTMLElement = first;

    const wrapper: ReactWrapper = mount(
      <DragHandle
        draggableId="child"
        callbacks={getStubCallbacks()}
        direction="vertical"
        isDragging={false}
        isDropAnimating={false}
        isEnabled
        getDraggableRef={() => dragHandleRef}
        canDragInteractiveElements={false}
      >
        {(props: ?DragHandleProps) => <Child dragHandleProps={props} />}
      </DragHandle>,
      { context: basicContext }
    );

    // does not start with focus
    expect(first).not.toBe(document.activeElement);

    // we give the first element focus
    first.focus();
    wrapper.simulate('focus');
    // expect(first).toBe(document.activeElement);
    // expect(second).not.toBe(document.activeElement);

    // changing our drag handle ref
    dragHandleRef = second;

    // forcing a re-render
    forceUpdate(wrapper);

    // first element has lost focus
    expect(first).not.toBe(document.activeElement);
    // second element now has focus
    expect(second).toBe(document.activeElement);
  });

  it('should not retain focus if draggable ref is changing and did not have focus', () => {

  });
});

describe('between mounts (allowing maintaining focus across list transitions)', () => {
  it('should maintain focus if unmounting while dragging', () => {

  });

  it('should maintain focus if unmounting while drop animating', () => {

  });

  it('should not give focus to something that was not previously focused', () => {

  });

  it('should maintain focus if another component is mounted before the focused component', () => {

  });

  it('should not obtain focus if focus is lost before unmount and remount', () => {

  });

  it('should not give focus if something else on the page has been focused on after unmount', () => {

  });
});
