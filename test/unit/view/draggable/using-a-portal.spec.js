// @flow
import React, { type Node } from 'react';
import ReactDOM from 'react-dom';
import type {
  Provided,
  StateSnapshot,
} from '../../../../src/view/draggable/draggable-types';
import mount from './util/mount';
import { whileDragging, atRestMapProps } from './util/get-props';
import loseFocus from './util/lose-focus';

// This is covered in focus-management.spec
// But I have included in here also to ensure that the entire
// consumer experience is tested (this is how a consumer would use it)
const body: ?HTMLElement = document.body;
if (!body) {
  throw new Error('Portal test requires document.body to be present');
}

class WithPortal extends React.Component<{
  provided: Provided,
  snapshot: StateSnapshot,
}> {
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
    const provided: Provided = this.props.provided;
    const snapshot: StateSnapshot = this.props.snapshot;

    const child: Node = (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        Drag me!
      </div>
    );

    if (!snapshot.isDragging) {
      return child;
    }

    // if dragging - put the item in a portal
    if (!this.portal) {
      throw new Error('could not find portal');
    }

    return ReactDOM.createPortal(child, this.portal);
  }
}

it('should keep focus if moving to a portal', () => {
  const wrapper = mount({
    WrappedComponent: WithPortal,
  });
  const original: HTMLElement = wrapper.getDOMNode();
  // originally does not have focus
  expect(original).not.toBe(document.activeElement);

  // giving focus to draggable
  original.focus();
  // ensuring that the focus event handler is called
  wrapper.simulate('focus');
  // new focused element!
  expect(original).toBe(document.activeElement);

  // starting a drag
  wrapper.setProps({
    ...whileDragging,
  });

  // now moved to portal
  const inPortal: HTMLElement = wrapper.getDOMNode();
  expect(inPortal).not.toBe(original);
  expect(inPortal.parentElement).toBe(
    wrapper.find(WithPortal).instance().portal,
  );

  // assert that focus was transferred to new element
  expect(inPortal).toBe(document.activeElement);
  expect(original).not.toBe(document.activeElement);

  // finishing a drag
  wrapper.setProps({
    ...atRestMapProps,
  });

  // non portaled element should now have focus passed back to it
  const latest: HTMLElement = wrapper.getDOMNode();
  expect(latest).toBe(document.activeElement);
  // latest will not be the same as the original
  // ref as it is remounted after leaving the portal
  expect(latest).not.toBe(original);
  // no longer in a portal
  expect(latest).not.toBe(wrapper.find(WithPortal).instance().portal);

  // cleanup
  loseFocus(wrapper);
  wrapper.unmount();
});

it('should not take focus if moving to a portal and did not previously have focus', () => {
  const wrapper = mount({
    WrappedComponent: WithPortal,
  });
  const original: HTMLElement = wrapper.getDOMNode();

  // originally does not have focus
  expect(original).not.toBe(document.activeElement);

  // starting a drag
  wrapper.setProps({
    ...whileDragging,
  });

  // now moved to portal
  const inPortal: HTMLElement = wrapper.getDOMNode();
  expect(inPortal).not.toBe(original);
  expect(inPortal.parentElement).toBe(
    wrapper.find(WithPortal).instance().portal,
  );

  // assert that focus was not transferred to new element
  expect(inPortal).not.toBe(document.activeElement);
  expect(original).not.toBe(document.activeElement);

  // finishing a drag
  wrapper.setProps({
    ...atRestMapProps,
  });

  // non portaled element should not take focus
  const latest: HTMLElement = wrapper.getDOMNode();
  expect(latest).not.toBe(document.activeElement);
  // latest will not be the same as the original ref as
  // it is remounted after leaving the portal
  expect(latest).not.toBe(original);
  // no longer in a portal
  expect(latest).not.toBe(wrapper.find(WithPortal).instance().portal);

  // cleanup
  wrapper.unmount();
});
