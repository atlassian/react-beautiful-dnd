// @flow
import React, { Component } from 'react';
import { type Position, type Spacing } from 'css-box-model';
import { mount } from 'enzyme';
import DraggableDimensionPublisher from '../../../src/view/draggable-dimension-publisher/draggable-dimension-publisher';
import setWindowScroll from '../../utils/set-window-scroll';
import {
  getPreset,
  getDraggableDimension,
  getComputedSpacing,
} from '../../utils/dimension';
import type {
  DimensionMarshal,
  GetDraggableDimensionFn,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import { withDimensionMarshal } from '../../utils/get-context-options';
import forceUpdate from '../../utils/force-update';
import tryCleanPrototypeStubs from '../../utils/try-clean-prototype-stubs';
import { getMarshalStub } from '../../utils/dimension-marshal';
import type {
  DraggableId,
  DraggableDimension,
  DraggableDescriptor,
} from '../../../src/types';

const preset = getPreset();
const noComputedSpacing = getComputedSpacing({});

type Props = {|
  index?: number,
  draggableId?: DraggableId,
|};

class Item extends Component<Props> {
  /* eslint-disable react/sort-comp */

  ref: ?HTMLElement;

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  };

  getRef = (): ?HTMLElement => this.ref;

  render() {
    return (
      <DraggableDimensionPublisher
        draggableId={this.props.draggableId || preset.inHome1.descriptor.id}
        index={this.props.index || preset.inHome1.descriptor.index}
        droppableId={preset.inHome1.descriptor.droppableId}
        type={preset.inHome1.descriptor.type}
        getDraggableRef={this.getRef}
      >
        <div ref={this.setRef}>hi</div>
      </DraggableDimensionPublisher>
    );
  }
}

beforeEach(() => {
  // having issues on CI
  tryCleanPrototypeStubs();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  tryCleanPrototypeStubs();
});

describe('dimension registration', () => {
  it('should register itself when mounting', () => {
    const marshal: DimensionMarshal = getMarshalStub();

    mount(<Item />, withDimensionMarshal(marshal));

    expect(marshal.registerDraggable).toHaveBeenCalledTimes(1);
    expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(
      preset.inHome1.descriptor,
    );
  });

  it('should unregister itself when unmounting', () => {
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper = mount(<Item />, withDimensionMarshal(marshal));
    expect(marshal.registerDraggable).toHaveBeenCalled();
    expect(marshal.unregisterDraggable).not.toHaveBeenCalled();

    wrapper.unmount();
    expect(marshal.unregisterDraggable).toHaveBeenCalledTimes(1);
    expect(marshal.unregisterDraggable).toHaveBeenCalledWith(
      preset.inHome1.descriptor,
    );
  });

  it('should update its registration when a descriptor property changes', () => {
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper = mount(<Item />, withDimensionMarshal(marshal));
    // asserting shape of original publish
    expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(
      preset.inHome1.descriptor,
    );

    // updating the index
    wrapper.setProps({
      index: 1000,
    });
    const newDescriptor: DraggableDescriptor = {
      ...preset.inHome1.descriptor,
      index: 1000,
    };
    expect(marshal.updateDraggable).toHaveBeenCalledWith(
      preset.inHome1.descriptor,
      newDescriptor,
      expect.any(Function),
    );
  });

  it('should not update its registration when a descriptor property does not change on an update', () => {
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper = mount(<Item />, withDimensionMarshal(marshal));
    expect(marshal.registerDraggable).toHaveBeenCalledTimes(1);

    forceUpdate(wrapper);
    expect(marshal.updateDraggable).not.toHaveBeenCalled();
  });
});

describe('dimension publishing', () => {
  afterEach(() => {
    tryCleanPrototypeStubs();
  });

  it('should publish the dimensions of the target when requested', () => {
    const expected: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'fake-id',
        droppableId: preset.home.descriptor.id,
        type: preset.home.descriptor.type,
        index: 10,
      },
      borderBox: {
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
      },
    });

    jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(() => expected.client.borderBox);
    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => noComputedSpacing);
    const marshal: DimensionMarshal = getMarshalStub();

    mount(
      <Item
        draggableId={expected.descriptor.id}
        index={expected.descriptor.index}
      />,
      withDimensionMarshal(marshal),
    );

    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DraggableDimension = getDimension({ x: 0, y: 0 });

    expect(result).toEqual(expected);
  });

  it('should consider any margins when calculating dimensions', () => {
    const margin: Spacing = {
      top: 10,
      right: 30,
      bottom: 40,
      left: 50,
    };
    const expected: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'fake-id',
        droppableId: preset.home.descriptor.id,
        type: preset.home.descriptor.type,
        index: 10,
      },
      borderBox: {
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
      },
      margin,
    });
    jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(() => expected.client.borderBox);
    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => getComputedSpacing({ margin }));
    const marshal: DimensionMarshal = getMarshalStub();

    mount(
      <Item
        draggableId={expected.descriptor.id}
        index={expected.descriptor.index}
      />,
      withDimensionMarshal(marshal),
    );

    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DraggableDimension = getDimension({ x: 0, y: 0 });

    expect(result).toEqual(expected);
  });

  it('should consider the window scroll when calculating dimensions', () => {
    const marshal: DimensionMarshal = getMarshalStub();
    const originalScroll: Position = {
      x: window.pageXOffset,
      y: window.pageYOffset,
    };
    const borderBox: Spacing = {
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
    };
    const expected: DraggableDimension = getDraggableDimension({
      descriptor: {
        id: 'fake-id',
        droppableId: preset.home.descriptor.id,
        type: preset.home.descriptor.type,
        index: 10,
      },
      borderBox,
      windowScroll: preset.windowScroll,
    });
    jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(() => borderBox);
    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => noComputedSpacing);
    setWindowScroll(preset.windowScroll);

    mount(
      <Item
        draggableId={expected.descriptor.id}
        index={expected.descriptor.index}
      />,
      withDimensionMarshal(marshal),
    );

    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DraggableDimension = getDimension(preset.windowScroll);

    expect(result).toEqual(expected);

    setWindowScroll(originalScroll);
  });

  it('should throw an error if no ref is provided when attempting to get a dimension', () => {
    class NoRefItem extends Component<*> {
      render() {
        return (
          <DraggableDimensionPublisher
            draggableId={preset.inHome1.descriptor.id}
            droppableId={preset.inHome1.descriptor.droppableId}
            type={preset.inHome1.descriptor.type}
            index={preset.inHome1.descriptor.index}
            getDraggableRef={() => undefined}
          >
            <div>hi</div>
          </DraggableDimensionPublisher>
        );
      }
    }
    const marshal: DimensionMarshal = getMarshalStub();

    mount(<NoRefItem />, withDimensionMarshal(marshal));

    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];

    // when we call the get dimension function without a ref things will explode
    expect(getDimension).toThrow();
  });
});
