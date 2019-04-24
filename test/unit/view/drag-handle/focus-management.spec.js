// @flow
import React, { type Node } from 'react';
import invariant from 'tiny-invariant';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import type { DragHandleProps } from '../../../../src/view/use-drag-handle/drag-handle-types';
import { getStubCallbacks } from './util/callbacks';
import { WithDragHandle } from './util/wrappers';
import { getMarshalStub } from '../../../utils/dimension-marshal';
import forceUpdate from '../../../utils/force-update';
import AppContext, {
  type AppContextValue,
} from '../../../../src/view/context/app-context';
import createRef from '../../../utils/create-ref';

const body: ?HTMLElement = document.body;
invariant(body, 'Cannot find body');

const appContext: AppContextValue = {
  marshal: getMarshalStub(),
  style: 'fake style context',
  canLift: () => true,
  isMovementAllowed: () => true,
};

describe('Portal usage (ref changing while mounted)', () => {
  type ChildProps = {|
    dragHandleProps: ?DragHandleProps,
    usePortal: boolean,
    setRef: (ref: ?HTMLElement) => void,
  |};
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
        <div
          {...this.props.dragHandleProps}
          ref={this.props.setRef}
          className="drag-handle"
        >
          Drag me!
        </div>
      );

      if (this.portal && this.props.usePortal) {
        return ReactDOM.createPortal(child, this.portal);
      }

      return child;
    }
  }
  class WithParentRefAndPortalChild extends React.Component<{
    usePortal: boolean,
  }> {
    // eslint-disable-next-line react/sort-comp
    ref: ?HTMLElement;

    setRef = (ref: ?HTMLElement) => {
      this.ref = ref;
    };

    render() {
      return (
        <AppContext.Provider value={appContext}>
          <WithDragHandle
            draggableId="child"
            callbacks={getStubCallbacks()}
            isDragging={false}
            isDropAnimating={false}
            isEnabled
            getDraggableRef={() => this.ref}
            canDragInteractiveElements={false}
            getShouldRespectForcePress={() => true}
          >
            {(dragHandleProps: ?DragHandleProps) => (
              <Child
                usePortal={this.props.usePortal}
                dragHandleProps={dragHandleProps}
                setRef={this.setRef}
              />
            )}
          </WithDragHandle>
        </AppContext.Provider>
      );
    }
  }

  it('should not try to retain focus if the ref has not changed', () => {
    const wrapper = mount(<WithParentRefAndPortalChild usePortal={false} />);

    const original: HTMLElement = wrapper.find('.drag-handle').getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // giving it focus
    original.focus();
    wrapper.simulate('focus');
    expect(original).toBe(document.activeElement);
    jest.spyOn(original, 'focus');

    // force render to run focus detection tests
    forceUpdate(wrapper);

    // element still has focus
    expect(original).toBe(document.activeElement);
    // should not manually call focus on element if there is no change
    expect(original.focus).not.toHaveBeenCalled();

    original.focus.mockRestore();
  });

  it('should retain focus if draggable ref is changing and had focus', () => {
    const wrapper = mount(<WithParentRefAndPortalChild usePortal={false} />);

    const original: HTMLElement = wrapper.find('.drag-handle').getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // giving it focus
    original.focus();
    wrapper.simulate('focus');
    expect(original).toBe(document.activeElement);

    // forcing change of parent ref by moving into a portal
    wrapper.setProps({
      usePortal: true,
    });

    const inPortal: HTMLElement = wrapper.find('.drag-handle').getDOMNode();
    expect(inPortal).toBe(document.activeElement);
    expect(inPortal).not.toBe(original);
    expect(original).not.toBe(document.activeElement);
  });

  it('should not retain focus if draggable ref is changing and did not have focus', () => {
    const wrapper = mount(<WithParentRefAndPortalChild usePortal={false} />);

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
    draggableId?: string,
    isDragging?: boolean,
    isDropAnimating?: boolean,
  |};
  class WithParentRef extends React.Component<WithParentRefProps> {
    // eslint-disable-next-line react/sort-comp
    ref: ?HTMLElement;

    static defaultProps = {
      draggableId: 'draggable',
      isDragging: false,
      isDropAnimating: false,
    };

    setRef = (ref: ?HTMLElement) => {
      this.ref = ref;
    };

    render() {
      return (
        <AppContext.Provider value={appContext}>
          <WithDragHandle
            draggableId={this.props.draggableId || 'draggable'}
            callbacks={getStubCallbacks()}
            isDragging={this.props.isDragging || false}
            isDropAnimating={this.props.isDropAnimating || false}
            isEnabled
            getDraggableRef={() => this.ref}
            canDragInteractiveElements={false}
            getShouldRespectForcePress={() => true}
          >
            {(dragHandleProps: ?DragHandleProps) => (
              <div
                ref={this.setRef}
                {...dragHandleProps}
                className="drag-handle"
              >
                Drag me!
              </div>
            )}
          </WithDragHandle>
        </AppContext.Provider>
      );
    }
  }

  it('should maintain focus if unmounting while dragging', () => {
    const first: ReactWrapper<*> = mount(<WithParentRef isDragging />);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find('.drag-handle').simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    const second: ReactWrapper<*> = mount(<WithParentRef />);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    // cleanup
    second.unmount();
  });

  it('should maintain focus if unmounting while drop animating', () => {
    const first: ReactWrapper<*> = mount(<WithParentRef isDropAnimating />);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find('.drag-handle').simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    const second: ReactWrapper<*> = mount(<WithParentRef />);
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
    const first: ReactWrapper<*> = mount(
      <WithParentRef isDragging={false} isDropAnimating={false} />,
    );
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find('.drag-handle').simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    // will not get focus as it was not previously dragging or drop animating
    const second: ReactWrapper<*> = mount(<WithParentRef />);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).not.toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);
  });

  it('should not give focus to something that was not previously focused', () => {
    const first: ReactWrapper<*> = mount(<WithParentRef isDragging />);
    const original: HTMLElement = first.getDOMNode();

    expect(original).not.toBe(document.activeElement);
    first.unmount();

    const second: ReactWrapper<*> = mount(<WithParentRef />);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).not.toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    // cleanup
    second.unmount();
  });

  it('should maintain focus if another component is mounted before the focused component', () => {
    const first: ReactWrapper<*> = mount(
      <WithParentRef draggableId="first" isDragging />,
    );
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find('.drag-handle').simulate('focus');
    expect(original).toBe(document.activeElement);

    // unmounting the first
    first.unmount();

    // mounting something with a different id
    const other: ReactWrapper<*> = mount(<WithParentRef draggableId="other" />);
    expect(other.getDOMNode()).not.toBe(document.activeElement);

    // mounting something with the same id as the first
    const second: ReactWrapper<*> = mount(
      <WithParentRef draggableId="first" />,
    );
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);

    // cleanup
    other.unmount();
    second.unmount();
  });

  it('should only maintain focus once', () => {
    const first: ReactWrapper<*> = mount(<WithParentRef isDropAnimating />);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find('.drag-handle').simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    // obtaining focus on first remount
    const second: ReactWrapper<*> = mount(<WithParentRef />);
    const latest: HTMLElement = second.getDOMNode();
    expect(latest).toBe(document.activeElement);
    // validation
    expect(latest).not.toBe(original);
    expect(original).not.toBe(document.activeElement);

    second.unmount();

    // should not obtain focus on the second remount
    const third: ReactWrapper<*> = mount(<WithParentRef />);
    expect(third.getDOMNode()).not.toBe(document.activeElement);

    // cleanup
    third.unmount();
  });

  it('should not give focus if something else on the page has been focused on after unmount', () => {
    // eslint-disable-next-line react/button-has-type
    const button: HTMLElement = document.createElement('button');
    body.appendChild(button);
    const first: ReactWrapper<*> = mount(<WithParentRef isDropAnimating />);
    const original: HTMLElement = first.getDOMNode();
    expect(original).not.toBe(document.activeElement);

    // get focus
    original.focus();
    first.find('.drag-handle').simulate('focus');
    expect(original).toBe(document.activeElement);

    first.unmount();

    // a button is focused on
    button.focus();
    expect(button).toBe(document.activeElement);

    // remount should now not claim focus
    const second: ReactWrapper<*> = mount(<WithParentRef />);
    expect(second.getDOMNode()).not.toBe(document.activeElement);
    // focus maintained on button
    expect(button).toBe(document.activeElement);
  });

  it('should not steal focus from an element with auto focus on mount', () => {
    function App() {
      const ref = createRef();
      return (
        <AppContext.Provider value={appContext}>
          <WithDragHandle
            draggableId="draggable"
            callbacks={getStubCallbacks()}
            isDragging={false}
            isDropAnimating={false}
            isEnabled
            getDraggableRef={ref.getRef}
            canDragInteractiveElements={false}
            getShouldRespectForcePress={() => true}
          >
            {(dragHandleProps: ?DragHandleProps) => (
              <div
                ref={ref.setRef}
                {...dragHandleProps}
                className="drag-handle"
              >
                Drag me!
                {/* autoFocus attribute does give focus, but does not trigger onFocus callback */}
                <textarea
                  ref={(el: ?HTMLElement) => {
                    // Replicating auto focus
                    // by leveraging the ref function.
                    invariant(
                      el instanceof HTMLElement,
                      'Expected el to be a html element',
                    );
                    el.focus();
                    // letting react know about it
                    Simulate.focus(el);
                  }}
                />
              </div>
            )}
          </WithDragHandle>
        </AppContext.Provider>
      );
    }

    const wrapper: ReactWrapper<*> = mount(<App />);

    // asserting drag handle did not steal focus
    expect(wrapper.find('textarea').getDOMNode()).toBe(document.activeElement);
  });
});
