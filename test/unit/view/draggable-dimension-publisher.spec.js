// @flow
import React, { Component } from 'react';
import { type Position, type Spacing, type BoxModel, offset, withScroll } from 'css-box-model';
import { mount } from 'enzyme';
import DraggableDimensionPublisher from '../../../src/view/draggable-dimension-publisher/draggable-dimension-publisher';
import setWindowScroll from '../../utils/set-window-scroll';
import { getPreset, getDraggableDimension, getComputedSpacing } from '../../utils/dimension';
import { negate, subtract, add } from '../../../src/state/position';
import type {
  DimensionMarshal,
  GetDraggableDimensionFn,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import { withDimensionMarshal } from '../../utils/get-context-options';
import forceUpdate from '../../utils/force-update';
import { setViewport } from '../../utils/viewport';
import { getMarshalStub } from '../../utils/get-dimension-marshal';
import { offsetByPosition } from '../../../src/state/spacing';
import type {
  DraggableId,
  DraggableDimension,
  DraggableDescriptor,
} from '../../../src/types';

const preset = getPreset();
const origin: Position = { x: 0, y: 0 };

const noComputedSpacing = getComputedSpacing({});

type Props = {|
  index?: number,
  draggableId ?: DraggableId,
  offset ?: Position,
  isDragging?: boolean,
|}

class Item extends Component<Props> {
  /* eslint-disable react/sort-comp */

  ref: ?HTMLElement

  setRef = (ref: ?HTMLElement) => {
    this.ref = ref;
  }

  getRef = (): ?HTMLElement => this.ref;

  render() {
    return (
      <DraggableDimensionPublisher
        draggableId={this.props.draggableId || preset.inHome1.descriptor.id}
        droppableId={preset.inHome1.descriptor.droppableId}
        index={this.props.index || preset.inHome1.descriptor.index}
        getDraggableRef={this.getRef}
        offset={this.props.offset || origin}
        isDragging={this.props.isDragging || false}
      >
        <div ref={this.setRef}>hi</div>
      </DraggableDimensionPublisher>
    );
  }
}

describe('DraggableDimensionPublisher', () => {
  beforeAll(() => {
    setViewport(preset.viewport);
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('dimension registration', () => {
    it('should register itself when mounting', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      mount(<Item />, withDimensionMarshal(marshal));

      expect(marshal.registerDraggable).toHaveBeenCalledTimes(1);
      expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(preset.inHome1.descriptor);
    });

    it('should unregister itself when unmounting', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<Item />, withDimensionMarshal(marshal));
      expect(marshal.registerDraggable).toHaveBeenCalled();
      expect(marshal.unregisterDraggable).not.toHaveBeenCalled();

      wrapper.unmount();
      expect(marshal.unregisterDraggable).toHaveBeenCalledTimes(1);
      expect(marshal.unregisterDraggable).toHaveBeenCalledWith(preset.inHome1.descriptor);
    });

    it('should update its registration when a descriptor property changes', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<Item index={3} />, withDimensionMarshal(marshal));
      const originalDescriptor: DraggableDescriptor = {
        id: preset.inHome1.descriptor.id,
        droppableId: preset.inHome1.descriptor.droppableId,
        index: 3,
      };
      // asserting shape of original publish
      expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(originalDescriptor);

      // updating the index
      wrapper.setProps({
        index: 4,
      });
      const newDescriptor: DraggableDescriptor = {
        id: preset.inHome1.descriptor.id,
        droppableId: preset.inHome1.descriptor.droppableId,
        index: 4,
      };
      // old descriptor unpublished
      expect(marshal.unregisterDraggable).toHaveBeenCalledTimes(1);
      expect(marshal.unregisterDraggable).toHaveBeenCalledWith(originalDescriptor);
      // newly published descriptor
      expect(marshal.registerDraggable.mock.calls[1][0]).toEqual(newDescriptor);
    });

    it('should not update its registration when a descriptor property does not change on an update', () => {
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<Item />, withDimensionMarshal(marshal));
      expect(marshal.registerDraggable).toHaveBeenCalledTimes(1);
      marshal.registerDraggable.mockReset();

      forceUpdate(wrapper);
      expect(marshal.registerDraggable).not.toHaveBeenCalled();
    });

    it('should unregister with the previous descriptor when changing', () => {
      // this is to guard against the case where the id has changed at run time
      const marshal: DimensionMarshal = getMarshalStub();

      const wrapper = mount(<Item />, withDimensionMarshal(marshal));
      // asserting shape of original publish
      expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(preset.inHome1.descriptor);

      // updating the index
      wrapper.setProps({
        draggableId: 'my-new-id',
      });
      // old descriptor unpublished
      expect(marshal.unregisterDraggable).toHaveBeenCalledTimes(1);
      expect(marshal.unregisterDraggable).toHaveBeenCalledWith(
        // unpublished with old descriptor
        preset.inHome1.descriptor
      );
      // newly published descriptor
      expect(marshal.registerDraggable.mock.calls[1][0]).toEqual({
        ...preset.inHome1.descriptor,
        id: 'my-new-id',
      });
    });
  });

  describe('dimension publishing', () => {
    afterEach(() => {
      // clean up any stubs
      if (Element.prototype.getBoundingClientRect.mockRestore) {
        Element.prototype.getBoundingClientRect.mockRestore();
      }
      if (window.getComputedStyle.mockRestore) {
        window.getComputedStyle.mockRestore();
      }
    });

    it('should publish the dimensions of the target when requested', () => {
      const expected: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'fake-id',
          droppableId: preset.home.descriptor.id,
          index: 10,
        },
        borderBox: {
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        },
      });

      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => expected.client.borderBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noComputedSpacing);
      const marshal: DimensionMarshal = getMarshalStub();

      mount(
        <Item
          draggableId={expected.descriptor.id}
          index={expected.descriptor.index}
        />,
        withDimensionMarshal(marshal)
      );

      // pull the get dimension function out
      const getDimension: GetDraggableDimensionFn = marshal.registerDraggable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DraggableDimension = getDimension();

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
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => expected.client.borderBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => getComputedSpacing({ margin }));
      const marshal: DimensionMarshal = getMarshalStub();

      mount(
        <Item
          draggableId={expected.descriptor.id}
          index={expected.descriptor.index}
        />,
        withDimensionMarshal(marshal)
      );

      // pull the get dimension function out
      const getDimension: GetDraggableDimensionFn = marshal.registerDraggable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DraggableDimension = getDimension();

      expect(result).toEqual(expected);
    });

    it('should consider the window scroll when calculating dimensions', () => {
      const marshal: DimensionMarshal = getMarshalStub();
      const originalScroll: Position = {
        x: window.pageXOffset,
        y: window.pageYOffset,
      };
      // const windowScroll: Position = {
      //   x: 100,
      //   y: 200,
      // };
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
          index: 10,
        },
        borderBox,
        windowScroll: preset.windowScroll,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => borderBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noComputedSpacing);
      setWindowScroll(preset.windowScroll);

      mount(
        <Item
          draggableId={expected.descriptor.id}
          index={expected.descriptor.index}
        />,
        withDimensionMarshal(marshal)
      );

      // pull the get dimension function out
      const getDimension: GetDraggableDimensionFn = marshal.registerDraggable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DraggableDimension = getDimension();

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
              index={preset.inHome1.descriptor.index}
              getDraggableRef={() => undefined}
              offset={origin}
              isDragging={false}
            >
              <div>hi</div>
            </DraggableDimensionPublisher>
          );
        }
      }
      const marshal: DimensionMarshal = getMarshalStub();

      mount(<NoRefItem />, withDimensionMarshal(marshal));

      // pull the get dimension function out
      const getDimension: GetDraggableDimensionFn = marshal.registerDraggable.mock.calls[0][1];

      // when we call the get dimension function without a ref things will explode
      expect(getDimension).toThrow();
    });
  });
});

describe('offset', () => {
  describe('when not dragging', () => {
    it.only('should account for any existing offset (caused by a drag)', () => {
      const original: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'fake-id',
          droppableId: preset.home.descriptor.id,
          index: 0,
        },
        borderBox: {
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        },
      });

      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => original.client.borderBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noComputedSpacing);
      const marshal: DimensionMarshal = getMarshalStub();
      const transform: Position = { x: 10, y: 20 };
      const undo: Position = negate(transform);
      const shiftedBox: BoxModel = offset(original.client, undo);

      mount(
        <Item
          draggableId={original.descriptor.id}
          index={original.descriptor.index}
          offset={transform}
        />,
        withDimensionMarshal(marshal)
      );

      // pull the get dimension function out
      const getDimension: GetDraggableDimensionFn = marshal.registerDraggable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DraggableDimension = getDimension(transform, origin);

      const expected: DraggableDimension = getDraggableDimension({
        descriptor: original.descriptor,
        borderBox: shiftedBox.borderBox,
      });

      expect(result.client).toEqual(expected.client);
    });
  });

  describe('when dragging', () => {
    it.only('should account for any change in window scroll', () => {
      const originalWindowScroll: Position = preset.windowScroll;
      const currentWindowScroll: Position = add(preset.windowScroll, { x: 10, y: 20 });
      const windowScrollDiff: Position = subtract(currentWindowScroll, originalWindowScroll);
      const original: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'fake-id',
          droppableId: preset.home.descriptor.id,
          index: 0,
        },
        borderBox: {
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        },
        windowScroll: originalWindowScroll,
      });

      const marshal: DimensionMarshal = getMarshalStub();
      // client border box is incorrect as it has not taken into account the scroll change
      const shifted: Spacing = offsetByPosition(original.client.borderBox, windowScrollDiff);
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => shifted);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noComputedSpacing);

      mount(
        <Item
          draggableId={original.descriptor.id}
          index={original.descriptor.index}
          offset={origin}
          isDragging
        />,
        withDimensionMarshal(marshal)
      );

      // pull the get dimension function out
      const getDimension: GetDraggableDimensionFn = marshal.registerDraggable.mock.calls[0][1];
      // execute it to get the dimension
      const result: DraggableDimension = getDimension(currentWindowScroll, windowScrollDiff);

      const unshifted: DraggableDimension = getDraggableDimension({
        descriptor: original.descriptor,
        // undoing shift caused by change in window scroll
        borderBox: original.client.borderBox,
        windowScroll: currentWindowScroll,
      });

      expect(result).toEqual(unshifted);
    });
  });
});
