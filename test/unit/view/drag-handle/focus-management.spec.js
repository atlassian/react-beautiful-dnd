// @flow
import React, { type Node } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import DragHandle from '../../../../src/view/drag-handle';
import { styleContextKey, canLiftContextKey } from '../../../../src/view/context-keys';
import type { DragHandleProps } from '../../../../src/view/drag-handle/drag-handle-types';
import { getStubCallbacks } from './util';

const options = {
  context: {
    [styleContextKey]: 'hello',
    [canLiftContextKey]: () => true,
  },
  childContextTypes: {
    [styleContextKey]: PropTypes.string.isRequired,
    [canLiftContextKey]: PropTypes.func.isRequired,
  },
};

const body: ?HTMLElement = document.body;

if (!body) {
  throw new Error('document.body not found');
}

describe('Portal usage (ref changing while mounted)', () => {
  type ChildProps = {|
    dragHandleProps: ?DragHandleProps,
    usePortal: boolean,
    setRef: (ref: ?HTMLElement) => void,
  |}
  class Child extends React.Component<ChildProps> {
    // eslint-disable-next-line react/sort-comp
    portal: ?HTMLElement;

    componentDidMount() {
      this.portal = document.createElement('div');
      body.appendChild(this.portal);
    }

    componentWillUnmount() {
      if (!this.portal) {
        return;
      }
      body.removeChild(this.portal);
      this.portal = null;
    }

    render() {
      const child: Node = (
        <div {...this.props.dragHandleProps} ref={this.props.setRef}>
          Drag me!
        </div>
      );

      if (this.portal && this.props.usePortal) {
        return ReactDOM.createPortal(child, this.portal);
      }

      return child;
    }
  }
  class WithParentRefAndPortalChild extends React.Component<{ usePortal: boolean }> {
    // eslint-disable-next-line react/sort-comp
    ref: ?HTMLElement;

    setRef = (ref: ?HTMLElement) => {
      this.ref = ref;
    }

    render() {
      return (
        <DragHandle
          draggableId="child"
          callbacks={getStubCallbacks()}
          isDragging={false}
          isDropAnimating={false}
          isEnabled
          getDraggableRef={() => this.ref}
          canDragInteractiveElements={false}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <Child
              usePortal={this.props.usePortal}
              dragHandleProps={dragHandleProps}
              setRef={this.setRef}
            />
          )}
        </DragHandle>
      );
    }
  }

  it('should retain focus if draggable ref is changing and had focus', () => {
    const wrapper = mount(<WithParentRefAndPortalChild usePortal={false} />, options);

    const original: HTMLElement = wrapper.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // giving it focus
    original.focus();
    wrapper.simulate('focus');
    expect(original).toBe(document.activeElement);

    // forcing change of parent ref by moving into a portal
    wrapper.setProps({
      usePortal: true,
    });

    const inPortal: HTMLElement = wrapper.getDOMNode();
    expect(inPortal).toBe(document.activeElement);
    expect(inPortal).not.toBe(original);
    expect(original).not.toBe(document.activeElement);
  });

  it('should not retain focus if draggable ref is changing and did not have focus', () => {
    const wrapper = mount(<WithParentRefAndPortalChild usePortal={false} />, options);

    const original: HTMLElement = wrapper.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // forcing change of parent ref by moving into a portal
    wrapper.setProps({
      usePortal: true,
    });

    const inPortal: HTMLElement = wrapper.getDOMNode();
    expect(inPortal).not.toBe(document.activeElement);
    expect(inPortal).not.toBe(original);
    expect(original).not.toBe(document.activeElement);
  });
});

describe('Focus retention moving between lists (focus retention between mounts)', () => {
  type WithParentRefProps = {|
    draggableId: string,
    isDragging: boolean,
    isDropAnimating: boolean
  |}
  class WithParentRef extends React.Component<WithParentRefProps> {
    // eslint-disable-next-line react/sort-comp
    ref: ?HTMLElement;

    static defaultProps = {
      draggableId: 'draggable',
      isDragging: false,
      isDropAnimating: false,
    }

    setRef = (ref: ?HTMLElement) => {
      this.ref = ref;
    }

    render() {
      return (
        <DragHandle
          draggableId={this.props.draggableId}
          callbacks={getStubCallbacks()}
          isDragging={this.props.isDragging}
          isDropAnimating={this.props.isDropAnimating}
          isEnabled
          getDraggableRef={() => this.ref}
          canDragInteractiveElements={false}
        >
          {(dragHandleProps: ?DragHandleProps) => (
            <div ref={this.setRef} {...dragHandleProps}>Drag me!</div>
          )}
        </DragHandle>
      );
    }
  }

  it('should maintain focus if unmounting while dragging', () => {
    const first: ReactWrapper = mount(<WithParentRef isDragging />, options);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find(DragHandle).simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    const second: ReactWrapper = mount(<WithParentRef />, options);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    // cleanup
    second.unmount();
  });

  it('should maintain focus if unmounting while drop animating', () => {
    const first: ReactWrapper = mount(<WithParentRef isDropAnimating />, options);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find(DragHandle).simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    const second: ReactWrapper = mount(<WithParentRef />, options);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    // cleanup
    second.unmount();
  });

  // This interaction has nothing to do with us!
  it('should not maintain focus if the item was not dragging or drop animating', () => {
    const first: ReactWrapper = mount(
      <WithParentRef isDragging={false} isDropAnimating={false} />, options
    );
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find(DragHandle).simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    // will not get focus as it was not previously dragging or drop animating
    const second: ReactWrapper = mount(<WithParentRef />, options);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).not.toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);
  });

  it('should not give focus to something that was not previously focused', () => {
    const first: ReactWrapper = mount(<WithParentRef isDragging />, options);
    const original: HTMLElement = first.getDOMNode();

    expect(original).not.toBe(document.activeElement);
    first.unmount();

    const second: ReactWrapper = mount(<WithParentRef />, options);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).not.toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    // cleanup
    second.unmount();
  });

  it('should maintain focus if another component is mounted before the focused component', () => {
    const first: ReactWrapper = mount(
      <WithParentRef draggableId="first" isDragging />, options
    );
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find(DragHandle).simulate('focus');
    expect(original).toBe(document.activeElement);

    // unmounting the first
    first.unmount();

    // mounting something with a different id
    const other: ReactWrapper = mount(
      <WithParentRef draggableId="other" />, options
    );
    expect(other.getDOMNode()).not.toBe(document.activeElement);

    // mounting something with the same id as the first
    const second: ReactWrapper = mount(
      <WithParentRef draggableId="first" />, options
    );
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);

    // cleanup
    other.unmount();
    second.unmount();
  });

  it('should only maintain focus once', () => {
    const first: ReactWrapper = mount(<WithParentRef isDropAnimating />, options);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find(DragHandle).simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    // obtaining focus on first remount
    const second: ReactWrapper = mount(<WithParentRef />, options);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    second.unmount();

    // should not obtain focus on the second remount
    const third: ReactWrapper = mount(<WithParentRef />, options);
    expect(third.getDOMNode()).not.toBe(document.activeElement);

    // cleanup
    second.unmount();
    third.unmount();
  });

  it('should not give focus if something else on the page has been focused on after unmount', () => {
    const button: HTMLElement = document.createElement('button');
    body.appendChild(button);
    const first: ReactWrapper = mount(<WithParentRef isDropAnimating />, options);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find(DragHandle).simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    // a button is focused on
    button.focus();
    expect(button).toBe(document.activeElement);

    // remount should now not claim focus
    const second: ReactWrapper = mount(<WithParentRef />, options);
    expect(second.getDOMNode()).not.toBe(document.activeElement);
    // focus maintained on button
    expect(button).toBe(document.activeElement);
  });
});
