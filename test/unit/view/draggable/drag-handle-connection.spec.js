// @flow
import React from 'react';
import { type Position } from 'css-box-model';
import type { ReactWrapper } from 'enzyme';
import type {
  DispatchProps,
  Provided,
} from '../../../../src/view/draggable/draggable-types';
import {
  draggable,
  getDispatchPropsStub,
  atRestMapProps,
  disabledOwnProps,
  whileDragging,
} from './util/get-props';
import type { Viewport } from '../../../../src/types';
import { origin } from '../../../../src/state/position';
import { getPreset } from '../../../utils/dimension';
import { setViewport } from '../../../utils/viewport';
import mount from './util/mount';
import Item from './util/item';
import DragHandle from '../../../../src/view/drag-handle';
import { withKeyboard } from '../../../utils/user-input-util';
import * as keyCodes from '../../../../src/view/key-codes';

const pressSpacebar = withKeyboard(keyCodes.space);
const viewport: Viewport = getPreset().viewport;

setViewport(viewport);

// we need to unmount after each test to avoid
// cross EventMarshal contamination
let managedWrapper: ?ReactWrapper = null;

afterEach(() => {
  if (managedWrapper) {
    managedWrapper.unmount();
    managedWrapper = null;
  }
});

it('should allow you to attach a drag handle', () => {
  const dispatchProps: DispatchProps = getDispatchPropsStub();
  managedWrapper = mount({
    dispatchProps,
    WrappedComponent: Item,
  });

  pressSpacebar(managedWrapper.find(Item));

  expect(dispatchProps.lift).toHaveBeenCalled();
});

describe('drag handle not the same element as draggable', () => {
  class WithCustomHandle extends React.Component<{ provided: Provided }> {
    render() {
      const provided: Provided = this.props.provided;
      return (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <div className="cannot-drag">Cannot drag by me</div>
          <div className="can-drag" {...provided.dragHandleProps}>
            Can drag by me
          </div>
        </div>
      );
    }
  }

  it('should allow the ability to have the drag handle to be a child of the draggable', () => {
    const dispatchProps: DispatchProps = getDispatchPropsStub();
    managedWrapper = mount({
      dispatchProps,
      WrappedComponent: WithCustomHandle,
    });

    pressSpacebar(managedWrapper.find(WithCustomHandle).find('.can-drag'));

    expect(dispatchProps.lift).toHaveBeenCalled();
  });

  it('should not drag by the draggable element', () => {
    const dispatchProps: DispatchProps = getDispatchPropsStub();
    managedWrapper = mount({
      dispatchProps,
      WrappedComponent: WithCustomHandle,
    });

    pressSpacebar(managedWrapper.find(WithCustomHandle));

    expect(dispatchProps.lift).not.toHaveBeenCalled();
  });

  it('should not drag by other elements', () => {
    const dispatchProps: DispatchProps = getDispatchPropsStub();
    managedWrapper = mount({
      dispatchProps,
      WrappedComponent: WithCustomHandle,
    });

    pressSpacebar(managedWrapper.find(WithCustomHandle).find('.cannot-drag'));

    expect(dispatchProps.lift).not.toHaveBeenCalled();
  });
});

describe('handling drag handle events', () => {
  describe('onLift', () => {
    it('should throw if lifted when dragging is not enabled', () => {
      const customWrapper = mount({
        ownProps: disabledOwnProps,
        mapProps: atRestMapProps,
      });

      expect(() => {
        customWrapper
          .find(DragHandle)
          .props()
          .callbacks.onLift({
            clientSelection: origin,
            movementMode: 'SNAP',
          });
      }).toThrow();
    });

    it('should throw if lifted when not attached to the dom', () => {
      const customWrapper = mount();
      customWrapper.unmount();

      expect(() => {
        customWrapper
          .find(DragHandle)
          .props()
          .callbacks.onLift({
            clientSelection: origin,
            movementMode: 'SNAP',
          });
      }).toThrow();
    });

    it('should lift if permitted', () => {
      const dispatchProps = getDispatchPropsStub();
      const wrapper = mount({
        dispatchProps,
      });

      wrapper
        .find(DragHandle)
        .props()
        .callbacks.onLift({
          clientSelection: origin,
          movementMode: 'SNAP',
        });

      // $ExpectError - mock property on lift function
      expect(dispatchProps.lift).toHaveBeenCalledWith({
        id: draggable.id,
        clientSelection: origin,
        movementMode: 'SNAP',
      });
    });

    describe('onMove', () => {
      it('should consider any mouse movement for the client coordinates', () => {
        const selection: Position = {
          x: 10,
          y: 50,
        };

        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onMove(selection);

        expect(dispatchProps.move).toHaveBeenCalledWith({
          client: selection,
        });
      });
    });

    describe('onDrop', () => {
      it('should trigger drop', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onDrop();

        expect(dispatchProps.drop).toHaveBeenCalled();
      });
    });

    describe('onMoveUp', () => {
      it('should call the move up action', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onMoveUp();

        expect(dispatchProps.moveUp).toHaveBeenCalled();
      });
    });

    describe('onMoveDown', () => {
      it('should call the move down action', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onMoveDown();

        expect(dispatchProps.moveDown).toHaveBeenCalled();
      });
    });

    describe('onMoveLeft', () => {
      it('should call the cross axis move forward action', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onMoveLeft();

        expect(dispatchProps.moveLeft).toHaveBeenCalled();
      });
    });

    describe('onMoveRight', () => {
      it('should call the move cross axis backwards action', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onMoveRight();

        expect(dispatchProps.moveRight).toHaveBeenCalled();
      });
    });

    describe('onCancel', () => {
      it('should call the drop dispatch prop', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onCancel();

        expect(dispatchProps.drop).toHaveBeenCalledWith({
          reason: 'CANCEL',
        });
      });

      it('should allow the action even if dragging is disabled', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          ownProps: disabledOwnProps,
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onCancel();

        expect(dispatchProps.drop).toHaveBeenCalled();
      });
    });

    describe('onWindowScroll', () => {
      it('should call the moveByWindowScroll action', () => {
        const dispatchProps = getDispatchPropsStub();
        const wrapper = mount({
          mapProps: whileDragging,
          dispatchProps,
        });

        wrapper
          .find(DragHandle)
          .props()
          .callbacks.onWindowScroll();

        expect(dispatchProps.moveByWindowScroll).toHaveBeenCalledWith({
          newScroll: viewport.scroll.current,
        });
      });
    });
  });
});
