// @flow
import React, { Component } from 'react';
import { mount } from 'enzyme';
import DraggableDimensionPublisher from '../../../src/view/draggable-dimension-publisher/draggable-dimension-publisher';
import { getDraggableDimension } from '../../../src/state/dimension';
import getArea from '../../../src/state/get-area';
import setWindowScroll from '../../utils/set-window-scroll';
import { getPreset } from '../../utils/dimension';
import type {
  DimensionMarshal,
  GetDraggableDimensionFn,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import { withDimensionMarshal } from '../../utils/get-context-options';
import forceUpdate from '../../utils/force-update';
import type {
  Spacing,
  Area,
  Position,
  DraggableId,
  DraggableDimension,
  DraggableDescriptor,
} from '../../../src/types';

const preset = getPreset();

const noSpacing = {
  marginTop: '0',
  marginRight: '0',
  marginBottom: '0',
  marginLeft: '0',
  paddingTop: '0',
  paddingRight: '0',
  paddingBottom: '0',
  paddingLeft: '0',
};

type State = {
  ref: ?HTMLElement
}

type Props = {|
  index?: number,
  draggableId?: DraggableId,
|}

class Item extends Component<Props, State> {
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
      >
        <div ref={this.setRef}>hi</div>
      </DraggableDimensionPublisher>
    );
  }
}

const getMarshalStub = (): DimensionMarshal => ({
  registerDraggable: jest.fn(),
  unregisterDraggable: jest.fn(),
  registerDroppable: jest.fn(),
  unregisterDroppable: jest.fn(),
  updateDroppableScroll: jest.fn(),
  updateDroppableIsEnabled: jest.fn(),
  scrollDroppable: jest.fn(),
  onPhaseChange: jest.fn(),
});

describe('DraggableDimensionPublisher', () => {
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
        paddingBox: getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
      });

      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.paddingBox.top,
        bottom: expected.page.paddingBox.bottom,
        left: expected.page.paddingBox.left,
        right: expected.page.paddingBox.right,
        height: expected.page.paddingBox.height,
        width: expected.page.paddingBox.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);
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
        paddingBox: getArea({
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
        }),
        margin,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        top: expected.page.paddingBox.top,
        bottom: expected.page.paddingBox.bottom,
        left: expected.page.paddingBox.left,
        right: expected.page.paddingBox.right,
        height: expected.page.paddingBox.height,
        width: expected.page.paddingBox.width,
      }));
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
        marginTop: `${margin.top}`,
        marginRight: `${margin.right}`,
        marginBottom: `${margin.bottom}`,
        marginLeft: `${margin.left}`,
      }));
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
      const windowScroll: Position = {
        x: 100,
        y: 200,
      };
      const paddingBox: Area = getArea({
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
      });
      const expected: DraggableDimension = getDraggableDimension({
        descriptor: {
          id: 'fake-id',
          droppableId: preset.home.descriptor.id,
          index: 10,
        },
        paddingBox,
        windowScroll,
      });
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => paddingBox);
      jest.spyOn(window, 'getComputedStyle').mockImplementation(() => noSpacing);
      setWindowScroll(windowScroll);

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
