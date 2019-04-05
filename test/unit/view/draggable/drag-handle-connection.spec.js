// @flow
import React from 'react';
import type { ReactWrapper } from 'enzyme';
import type {
  DispatchProps,
  Provided,
} from '../../../../src/view/draggable/draggable-types';
import { getDispatchPropsStub } from './util/get-props';
import type { Viewport } from '../../../../src/types';
import { getPreset } from '../../../utils/dimension';
import { setViewport } from '../../../utils/viewport';
import mount from './util/mount';
import Item from './util/item';
import { withKeyboard } from '../../../utils/user-input-util';
import * as keyCodes from '../../../../src/view/key-codes';

const pressSpacebar = withKeyboard(keyCodes.space);
const viewport: Viewport = getPreset().viewport;

setViewport(viewport);

// we need to unmount after each test to avoid
// cross EventMarshal contamination
let managedWrapper: ?ReactWrapper<*> = null;

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
