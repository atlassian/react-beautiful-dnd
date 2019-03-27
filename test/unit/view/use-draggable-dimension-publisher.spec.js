// @flow
import React, { useRef, useCallback } from 'react';
import invariant from 'tiny-invariant';
import { type Spacing, type Rect } from 'css-box-model';
import { mount, type ReactWrapper } from 'enzyme';
import useDraggableDimensionPublisher from '../../../src/view/use-draggable-dimension-publisher';
import {
  getPreset,
  getDraggableDimension,
  getComputedSpacing,
} from '../../utils/dimension';
import type {
  DimensionMarshal,
  GetDraggableDimensionFn,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import forceUpdate from '../../utils/force-update';
import tryCleanPrototypeStubs from '../../utils/try-clean-prototype-stubs';
import { getMarshalStub } from '../../utils/dimension-marshal';
import type {
  DraggableId,
  DraggableDimension,
  DraggableDescriptor,
} from '../../../src/types';
import AppContext, {
  type AppContextValue,
} from '../../../src/view/context/app-context';
import DroppableContext, {
  type DroppableContextValue,
} from '../../../src/view/context/droppable-context';

const preset = getPreset();
const noComputedSpacing = getComputedSpacing({});

type ItemProps = {|
  index: number,
  draggableId: DraggableId,
|};

type AppProps = {|
  marshal: DimensionMarshal,
  index?: number,
  draggableId?: DraggableId,
  Component?: any,
|};

function Item(props: ItemProps) {
  const ref = useRef<?HTMLElement>(null);
  const setRef = useCallback((value: ?HTMLElement) => {
    ref.current = value;
  }, []);
  const getRef = useCallback((): ?HTMLElement => ref.current, []);

  useDraggableDimensionPublisher({
    draggableId: props.draggableId,
    index: props.index,
    getDraggableRef: getRef,
  });

  return <div ref={setRef}>hi</div>;
}

function App({
  marshal,
  draggableId = preset.inHome1.descriptor.id,
  index = preset.inHome1.descriptor.index,
  Component = Item,
}: AppProps) {
  const appContext: AppContextValue = {
    marshal,
    style: '1',
    canLift: () => true,
    isMovementAllowed: () => true,
  };
  const droppableContext: DroppableContextValue = {
    type: preset.inHome1.descriptor.type,
    droppableId: preset.inHome1.descriptor.droppableId,
  };

  const itemProps: ItemProps = {
    draggableId,
    index,
  };

  return (
    <AppContext.Provider value={appContext}>
      <DroppableContext.Provider value={droppableContext}>
        <Component {...itemProps} />
      </DroppableContext.Provider>
    </AppContext.Provider>
  );
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

    mount(<App marshal={marshal} />);

    expect(marshal.registerDraggable).toHaveBeenCalledTimes(1);
    expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(
      preset.inHome1.descriptor,
    );
  });

  it('should unregister itself when unmounting', () => {
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper = mount(<App marshal={marshal} />);
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

    const wrapper = mount(<App marshal={marshal} />);
    // asserting shape of original publish
    expect(marshal.registerDraggable.mock.calls[0][0]).toEqual(
      preset.inHome1.descriptor,
    );
    marshal.registerDraggable.mockClear();
    marshal.registerDroppable.mockClear();

    // updating the index
    wrapper.setProps({
      index: 1000,
    });
    const newDescriptor: DraggableDescriptor = {
      ...preset.inHome1.descriptor,
      index: 1000,
    };

    // Descriptor updated
    expect(marshal.updateDraggable).toHaveBeenCalledWith(
      preset.inHome1.descriptor,
      newDescriptor,
      expect.any(Function),
    );
    // Nothing else changed
    expect(marshal.registerDraggable).not.toHaveBeenCalled();
    expect(marshal.unregisterDraggable).not.toHaveBeenCalled();
  });

  it('should not update its registration when a descriptor property does not change on an update', () => {
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper = mount(<App marshal={marshal} />);
    expect(marshal.registerDraggable).toHaveBeenCalledTimes(1);

    forceUpdate(wrapper);
    expect(marshal.updateDraggable).not.toHaveBeenCalled();
  });
});

describe('dimension publishing', () => {
  // we are doing this rather than spying on the prototype.
  // Sometimes setRef was being provided with an element that did not have the mocked prototype :|
  const setBoundingClientRect = (wrapper: ReactWrapper<*>, borderBox: Rect) => {
    const ref: ?HTMLElement = wrapper.getDOMNode();
    invariant(ref);

    // $FlowFixMe - normally a read only thing. Muhaha
    ref.getBoundingClientRect = () => borderBox;
  };

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
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => noComputedSpacing);
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper: ReactWrapper<*> = mount(
      <App
        marshal={marshal}
        draggableId={expected.descriptor.id}
        index={expected.descriptor.index}
      />,
    );

    setBoundingClientRect(wrapper, expected.client.borderBox);

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
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => getComputedSpacing({ margin }));
    const marshal: DimensionMarshal = getMarshalStub();

    const wrapper: ReactWrapper<*> = mount(
      <App
        marshal={marshal}
        draggableId={expected.descriptor.id}
        index={expected.descriptor.index}
      />,
    );

    setBoundingClientRect(wrapper, expected.client.borderBox);

    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DraggableDimension = getDimension({ x: 0, y: 0 });

    expect(result).toEqual(expected);
  });

  it('should consider the window scroll when calculating dimensions', () => {
    const marshal: DimensionMarshal = getMarshalStub();
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
      windowScroll: preset.windowScroll,
    });
    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(() => noComputedSpacing);

    const wrapper: ReactWrapper<*> = mount(
      <App
        draggableId={expected.descriptor.id}
        index={expected.descriptor.index}
        marshal={marshal}
      />,
    );

    setBoundingClientRect(wrapper, expected.client.borderBox);

    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];
    // execute it to get the dimension
    const result: DraggableDimension = getDimension(preset.windowScroll);

    expect(result).toEqual(expected);
  });

  it('should throw an error if no ref is provided when attempting to get a dimension', () => {
    function NoRefItem(props: ItemProps) {
      const ref = useRef<?HTMLElement>(null);
      const getRef = useCallback((): ?HTMLElement => ref.current, []);

      useDraggableDimensionPublisher({
        draggableId: props.draggableId,
        index: props.index,
        getDraggableRef: getRef,
      });

      return <div>hi</div>;
    }
    const marshal: DimensionMarshal = getMarshalStub();
    const wrapper: ReactWrapper<*> = mount(
      <App marshal={marshal} Component={NoRefItem} />,
    );
    // pull the get dimension function out
    const getDimension: GetDraggableDimensionFn =
      marshal.registerDraggable.mock.calls[0][1];
    // when we call the get dimension function without a ref things will explode
    expect(getDimension).toThrow();
    wrapper.unmount();
  });
});
