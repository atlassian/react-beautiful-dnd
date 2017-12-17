// @flow
import { getPreset } from '../../utils/dimension';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import noImpact from '../../../src/state/no-impact';
import type {
  Callbacks,
  DimensionMarshal,
  DroppableCallbacks,
  GetDraggableDimensionFn,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  State,
  DraggableDescriptor,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableId,
  DroppableId,
  ClientRect,
  DimensionState,
  DragState,
  Position,
  CurrentDragPositions,
  InitialDragPositions,
  DroppableDescriptor,
  PendingDrop,
  DropResult,
} from '../../../src/types';

const getCallbackStub = (): Callbacks => {
  const callbacks: Callbacks = {
    cancel: jest.fn(),
    publishDraggables: jest.fn(),
    publishDroppables: jest.fn(),
    updateDroppableScroll: jest.fn(),
  };
  return callbacks;
};

type PopulateMarshalState = {|
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

const preset = getPreset();

const defaultArgs: PopulateMarshalState = {
  draggables: preset.draggables,
  droppables: preset.droppables,
};

type PopulateMarshalWatches = {
  draggable: {|
    getDimension: Function,
  |},
  droppable: {|
    watchScroll: Function,
    unwatchScroll: Function,
    getDimension: Function,
  |},
}

const populateMarshal = (
  marshal: DimensionMarshal,
  args?: PopulateMarshalState = defaultArgs
): PopulateMarshalWatches => {
  const { draggables, droppables } = args;
  const watches: PopulateMarshalWatches = {
    draggable: {
      getDimension: jest.fn(),
    },
    droppable: {
      watchScroll: jest.fn(),
      unwatchScroll: jest.fn(),
      getDimension: jest.fn(),
    },
  };

  Object.keys(droppables).forEach((id: DroppableId) => {
    const droppable: DroppableDimension = droppables[id];
    const callbacks: DroppableCallbacks = {
      getDimension: (): DroppableDimension => {
        watches.droppable.getDimension(id);
        return droppable;
      },
      watchScroll: () => {
        watches.droppable.watchScroll(id);
      },
      unwatchScroll: () => {
        watches.droppable.unwatchScroll(id);
      },
    };

    marshal.registerDroppable(droppable.descriptor, callbacks);
  });

  Object.keys(draggables).forEach((id: DraggableId) => {
    const draggable: DraggableDimension = draggables[id];
    const getDimension = (): DraggableDimension => {
      watches.draggable.getDimension(id);
      return draggable;
    };
    marshal.registerDraggable(draggable.descriptor, getDimension);
  });

  return watches;
};

const state = (() => {
  const getDimensionState = (request: DraggableDescriptor): DimensionState => {
    const draggable: DraggableDimension = preset.draggables[request.id];
    const home: DroppableDimension = preset.droppables[request.droppableId];

    const result: DimensionState = {
      request,
      draggable: { [draggable.descriptor.id]: draggable },
      droppable: { [home.descriptor.id]: home },
    };
    return result;
  };

  const idle: State = {
    phase: 'IDLE',
    drag: null,
    drop: null,
    dimension: {
      request: null,
      draggable: {},
      droppable: {},
    },
  };

  const requesting = (request: DraggableDescriptor): State => {
    const result: State = {
      phase: 'COLLECTING_INITIAL_DIMENSIONS',
      drag: null,
      drop: null,
      dimension: {
        request,
        draggable: {},
        droppable: {},
      },
    };
    return result;
  };

  const origin: Position = { x: 0, y: 0 };

  const dragging = (descriptor: DraggableDescriptor): State => {
    // will populate the dimension state with the initial dimensions
    const draggable: DraggableDimension = preset.draggables[descriptor.id];
    const client: Position = draggable.client.withMargin.center;
    const initialPosition: InitialDragPositions = {
      selection: client,
      center: client,
    };
    const clientPositions: CurrentDragPositions = {
      selection: client,
      center: client,
      offset: origin,
    };

    const drag: DragState = {
      initial: {
        descriptor,
        isScrollAllowed: true,
        client: initialPosition,
        page: initialPosition,
        windowScroll: origin,
      },
      current: {
        client: clientPositions,
        page: clientPositions,
        windowScroll: origin,
        shouldAnimate: true,
      },
      impact: noImpact,
    };

    const result: State = {
      phase: 'DRAGGING',
      drag,
      drop: null,
      dimension: getDimensionState(descriptor),
    };

    return result;
  };

  const dropAnimating = (descriptor: DraggableDescriptor): State => {
    const home: DroppableDescriptor = preset.droppables[descriptor.droppableId].descriptor;
    const pending: PendingDrop = {
      trigger: 'DROP',
      newHomeOffset: origin,
      impact: noImpact,
      result: {
        draggableId: descriptor.id,
        type: home.type,
        source: {
          droppableId: home.id,
          index: descriptor.index,
        },
        destination: null,
      },
    };

    const result: State = {
      phase: 'DROP_ANIMATING',
      drag: null,
      drop: {
        pending,
        result: null,
      },
      dimension: getDimensionState(descriptor),
    };
    return result;
  };

  const dropComplete = (descriptor: DraggableDescriptor): State => {
    const home: DroppableDescriptor = preset.droppables[descriptor.droppableId].descriptor;
    const result: DropResult = {
      draggableId: descriptor.id,
      type: home.type,
      source: {
        droppableId: home.id,
        index: descriptor.index,
      },
      destination: null,
    };

    const value: State = {
      phase: 'DROP_COMPLETE',
      drag: null,
      drop: {
        pending: null,
        result,
      },
      dimension: {
        request: null,
        draggable: {},
        droppable: {},
      },
    };
    return value;
  };

  return { idle, requesting, dragging, dropAnimating, dropComplete };
})();

const fakeClientRect: ClientRect = getClientRect({
  top: 0, right: 100, bottom: 100, left: 0,
});

const ofAnotherType: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'of-another-type',
    type: 'another-type',
  },
  clientRect: fakeClientRect,
});
const childOfAnotherType: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'addition',
    droppableId: ofAnotherType.descriptor.id,
    index: 0,
  },
  clientRect: fakeClientRect,
});

describe('dimension marshal', () => {
  beforeAll(() => {
    requestAnimationFrame.reset();
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    requestAnimationFrame.reset();
    jest.useRealTimers();
    console.error.mockRestore();
  });

  describe('drag starting (including early cancel)', () => {
    describe('invalid start state', () => {
      it('should cancel the collecting if already collecting', () => {

      });

      it('should cancel the collection if the draggable cannot be found', () => {

      });

      it('should cancel the collection if the home droppable cannot be found', () => {

      });
    });

    describe('pre drag start actions', () => {
      it('should publish the home droppable and dragging item', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

        expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDraggables).toBeCalledWith([preset.inHome1]);
        expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDroppables).toBeCalledWith([preset.home]);
      });

      it('should ask the home droppable to start listening to scrolling', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        const watches = populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

        // it should not watch scroll on the other droppables at this stage
        expect(watches.droppable.watchScroll).toHaveBeenCalledTimes(1);
        expect(watches.droppable.watchScroll).toHaveBeenCalledWith(preset.home.descriptor.id);
      });
    });

    describe('post drag start actions', () => {
      describe('before the first frame', () => {
        it('should not do anything if the drag was cancelled before a drag started', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
          // moving to idle state before moving to dragging state
          marshal.onPhaseChange(state.idle);

          // flushing any timers
          jest.runAllTimers();
          requestAnimationFrame.flush();

          // nothing happened
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
        });
      });

      describe('in the first frame (the collection frame)', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
          callbacks.publishDroppables.mockClear();
          callbacks.publishDraggables.mockClear();
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          // an animation frame is now pending - cancel drag before it starts
          marshal.onPhaseChange(state.idle);

          // flush all timers - would normally collect and publish
          requestAnimationFrame.flush();

          expect(callbacks.publishDraggables).not.toHaveBeenCalled();
          expect(watchers.droppable.getDimension).not.toHaveBeenCalled();
        });

        it('should collect all of the dimensions', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(1);
          expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(1);
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step();

          // all dimensions have been collected
          // length -1 as the initial dimensions have already been collected
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(preset.draggables).length - 1);
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(preset.droppables).length - 1);
        });

        it('should only collect dimensions have the same type as the dragging item', () => {
          const droppables: DroppableDimensionMap = {
            ...preset.droppables,
            [ofAnotherType.descriptor.id]: ofAnotherType,
          };
          const draggables: DraggableDimensionMap = {
            ...preset.draggables,
            [childOfAnotherType.descriptor.id]: childOfAnotherType,
          };
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal, {
            draggables,
            droppables,
          });

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          // clearing the initial calls
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step();

          expect(watchers.draggable.getDimension)
            .not.toHaveBeenCalledWith(childOfAnotherType.descriptor.id);
          expect(watchers.droppable.getDimension)
            .not.toHaveBeenCalledWith(ofAnotherType.descriptor.id);

          // should not have requested the dimension for the added draggable and droppable
          // - 1 for the original values && - 1 for the dimensions of different types
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(draggables).length - 2);
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(droppables).length - 2);
        });

        it('should not collect the dragging dimension as it has already been collected', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

          // called straight away
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledWith(preset.inHome1.descriptor.id);
          // clear the watchers state
          watchers.draggable.getDimension.mockClear();

          // will trigger the collection
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step();

          expect(watchers.draggable.getDimension).toHaveBeenCalled();
          expect(watchers.draggable.getDimension)
            .not.toHaveBeenCalledWith(preset.inHome1.descriptor.id);
        });

        it('should not collect the home droppable dimension as it has already been collected', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

          // called straight away
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledWith(preset.home.descriptor.id);
          // clear the watchers state
          watchers.droppable.getDimension.mockClear();

          // will trigger the collection
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step();

          expect(watchers.droppable.getDimension).toHaveBeenCalled();
          expect(watchers.droppable.getDimension)
            .not.toHaveBeenCalledWith(preset.home.descriptor.id);
        });

        it('should cancel the drag if the current dragging item does not match the requested item', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

          // called straight away
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledWith(preset.home.descriptor.id);
          // clear the watchers state
          watchers.droppable.getDimension.mockClear();
          watchers.draggable.getDimension.mockClear();

          // a different descriptor
          marshal.onPhaseChange(state.dragging(preset.inHome2.descriptor));

          expect(callbacks.cancel).toHaveBeenCalled();
          expect(console.error).toHaveBeenCalled();

          // flush frames to ensure that a collection is not occurring
          requestAnimationFrame.flush();
          expect(watchers.draggable.getDimension).not.toHaveBeenCalled();
          expect(watchers.droppable.getDimension).not.toHaveBeenCalled();
        });
      });

      describe('in the second frame (the publish frame)', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          // clearing initial calls
          callbacks.publishDraggables.mockClear();
          callbacks.publishDroppables.mockClear();

          // execute collection frame
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step();

          // cancelled before second frame fired
          marshal.onPhaseChange(state.idle);
          requestAnimationFrame.step();

          // nothing additional called
          expect(callbacks.publishDraggables).not.toHaveBeenCalled();
          expect(callbacks.publishDroppables).not.toHaveBeenCalled();
        });

        it('should publish all the collected draggables', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          // clearing initial calls
          callbacks.publishDraggables.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step(2);

          // calls are batched
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
          const result: DraggableDimension[] = callbacks.publishDraggables.mock.calls[0][0];
          // not calling for the dragging item
          expect(result.length).toBe(Object.keys(preset.draggables).length - 1);
          // super explicit test
          // - doing it like this because the order of Object.keys is not guarenteed
          Object.keys(preset.draggables).forEach((id: DraggableId) => {
            if (id === preset.inHome1.descriptor.id) {
              expect(result).not.toContain(preset.inHome1);
              return;
            }
            expect(result).toContain(preset.draggables[id]);
          });
        });

        it('should publish all the collected droppables', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          // clearing initial calls
          callbacks.publishDroppables.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step(2);

          // calls are batched
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          const result: DroppableDimension[] = callbacks.publishDroppables.mock.calls[0][0];
          // not calling for the dragging item
          expect(result.length).toBe(Object.keys(preset.droppables).length - 1);
          // super explicit test
          // - doing it like this because the order of Object.keys is not guarenteed
          Object.keys(preset.droppables).forEach((id: DroppableId) => {
            if (id === preset.home.descriptor.id) {
              expect(result.includes(preset.home)).toBe(false);
              return;
            }
            expect(result.includes(preset.droppables[id])).toBe(true);
          });
        });

        it('should request all the droppables to start listening to scroll events', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          // initial droppable
          expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(1);
          // clearing this initial call
          watchers.droppable.watchScroll.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step(2);

          // excluding the home droppable
          const expectedLength: number = Object.keys(preset.droppables).length - 1;
          expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(expectedLength);
        });

        it('should not publish dimensions that where not collected', () => {
          const droppables: DroppableDimensionMap = {
            ...preset.droppables,
            [ofAnotherType.descriptor.id]: ofAnotherType,
          };
          const draggables: DraggableDimensionMap = {
            ...preset.draggables,
            [childOfAnotherType.descriptor.id]: childOfAnotherType,
          };
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables,
            droppables,
          });

          marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
          requestAnimationFrame.step(2);

          expect(callbacks.publishDroppables.mock.calls[0][0]).not.toContain(ofAnotherType);
          expect(callbacks.publishDraggables.mock.calls[0][0]).not.toContain(childOfAnotherType);
        });
      });
    });
  });

  describe('drag completed after initial collection', () => {
    it('should unwatch all the scroll events on droppables', () => {
      [
        state.idle,
        state.dropAnimating(preset.inHome1.descriptor),
        state.dropComplete(preset.inHome1.descriptor),
      ].forEach((finish: State) => {
        const marshal = createDimensionMarshal(getCallbackStub());
        const watchers = populateMarshal(marshal);

        // do initial work
        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));
        marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
        requestAnimationFrame.step(2);

        // currently only watching
        Object.keys(preset.droppables).forEach((id: DroppableId) => {
          expect(watchers.droppable.watchScroll).toHaveBeenCalledWith(id);
          expect(watchers.droppable.unwatchScroll).not.toHaveBeenCalledWith(id);
        });

        // finishing the drag
        marshal.onPhaseChange(finish);
        // now unwatch has been called
        Object.keys(preset.droppables).forEach((id: DroppableId) => {
          expect(watchers.droppable.unwatchScroll).toHaveBeenCalledWith(id);
        });
      });
    });
  });

  describe('subsequent drags', () => {
    const droppableCount: number = Object.keys(preset.droppables).length;
    const draggableCount: number = Object.keys(preset.draggables).length;
    let callbacks: Callbacks;
    let marshal: DimensionMarshal;
    let watchers;

    const resetMocks = () => {
      callbacks.publishDraggables.mockClear();
      callbacks.publishDroppables.mockClear();
      watchers.draggable.getDimension.mockClear();
      watchers.droppable.getDimension.mockClear();
      watchers.droppable.watchScroll.mockClear();
      watchers.droppable.unwatchScroll.mockClear();
    };

    beforeEach(() => {
      callbacks = getCallbackStub();
      marshal = createDimensionMarshal(callbacks);
      watchers = populateMarshal(marshal);
    });

    const shouldHaveProcessedInitialDimensions = (): void => {
      expect(callbacks.publishDroppables).toHaveBeenCalledWith([preset.home]);
      expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
      expect(callbacks.publishDraggables).toHaveBeenCalledWith([preset.inHome1]);
      expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
      expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(1);
      expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(1);
      expect(watchers.droppable.watchScroll).toHaveBeenCalledWith(preset.home.descriptor.id);
      expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(1);
      expect(watchers.droppable.unwatchScroll).not.toHaveBeenCalled();
    };

    const shouldNotHavePublishedDimensions = (): void => {
      expect(callbacks.publishDroppables).not.toHaveBeenCalled();
      expect(callbacks.publishDroppables).not.toHaveBeenCalled();
    };

    it('should support subsequent drags after a completed collection', () => {
      Array.from({ length: 4 }).forEach(() => {
        // initial publish
        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

        shouldHaveProcessedInitialDimensions();

        // resetting mock state so future assertions do not include these calls
        resetMocks();

        // collection and publish of secondary dimensions
        marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
        requestAnimationFrame.step(2);

        expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
        expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(droppableCount - 1);
        expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(droppableCount - 1);
        expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(draggableCount - 1);
        expect(watchers.droppable.unwatchScroll).not.toHaveBeenCalled();

        // finish the collection
        marshal.onPhaseChange(state.dropComplete(preset.inHome1.descriptor));

        expect(watchers.droppable.unwatchScroll).toHaveBeenCalledTimes(droppableCount);

        resetMocks();
      });
    });

    it('should support subsequent drags after a cancelled dimension request', () => {
      Array.from({ length: 4 }).forEach(() => {
        // start the collection
        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

        shouldHaveProcessedInitialDimensions();
        resetMocks();

        // cancelled
        marshal.onPhaseChange(state.idle);

        shouldNotHavePublishedDimensions();

        resetMocks();
      });
    });

    it('should support subsequent drags after a cancelled drag', () => {
      Array.from({ length: 4 }).forEach(() => {
        // start the collection
        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

        shouldHaveProcessedInitialDimensions();
        resetMocks();

        // drag started but collection not started
        marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));

        shouldNotHavePublishedDimensions();

        // cancelled
        marshal.onPhaseChange(state.idle);
        resetMocks();
      });
    });

    it('should support subsequent drags after a cancelled collection', () => {
      Array.from({ length: 4 }).forEach(() => {
        // start the collection
        marshal.onPhaseChange(state.requesting(preset.inHome1.descriptor));

        shouldHaveProcessedInitialDimensions();
        resetMocks();

        // drag started but collection not started
        marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor));
        // executing collection step but not publish
        requestAnimationFrame.step();

        shouldNotHavePublishedDimensions();

        // cancelled
        marshal.onPhaseChange(state.idle);
        resetMocks();
      });
    });
  });

  describe('registration change while not collecting', () => {
    const droppableCallbacks: DroppableCallbacks = {
      getDimension: () => preset.home,
      watchScroll: () => { },
      unwatchScroll: () => { },
    };
    const getDraggableDimensionFn: GetDraggableDimensionFn = () => preset.inHome1;

    describe('dimension added', () => {
      describe('droppable', () => {
        it('should log an error if there is already an entry with the same id', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          expect(console.error).not.toHaveBeenCalled();

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          expect(console.error).toHaveBeenCalled();
        });

        it('should be published in the next collection', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables: {}, droppables: {},
          });

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);

          expect(callbacks.publishDroppables).toHaveBeenCalledWith([preset.home]);
        });
      });

      describe('draggable', () => {
        it('should log an error if there is no matching droppable', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          expect(console.error).toHaveBeenCalled();
        });

        it('should log an error if there is already an entry with the same id', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          // need to register a droppable first
          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);

          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          expect(console.error).not.toHaveBeenCalled();

          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          expect(console.error).toHaveBeenCalled();
        });

        it('should be published in the next collection', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables: {}, droppables: {},
          });

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);

          expect(callbacks.publishDraggables).toHaveBeenCalledWith([preset.inHome1]);
        });
      });
    });

    describe('dimension removed', () => {
      describe('droppable', () => {
        it('should log an error if there is no entry with a matching id', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.unregisterDroppable(preset.inHome1.descriptor.id);

          expect(console.error).toHaveBeenCalled();
        });

        it('should not error if the droppable still has registered draggables', () => {
          // Even though this leaves orphans, the in react the parent is unmounted before the child
          // removing foreign droppable
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          // unregistering the foreign droppable without unregistering its children
          marshal.unregisterDroppable(preset.foreign.descriptor.id);
          expect(console.error).not.toHaveBeenCalled();
        });

        it('should remove the dimension if it exists', () => {
          // removing foreign droppable
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          // unregistering the foreign droppable
          marshal.unregisterDroppable(preset.foreign.descriptor.id);
          // unregistering all children to prevent orphan children log
          preset.inForeignList.forEach((dimension: DraggableDimension) => {
            marshal.unregisterDraggable(dimension.descriptor.id);
          });
          expect(console.error).not.toHaveBeenCalled();

          // lift, collect and publish
          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);
          // clearing state from original publish
          callbacks.publishDroppables.mockClear();
          executeCollectionAndPublish();

          expect(watchers.droppable.getDimension)
            .not.toHaveBeenCalledWith(preset.foreign.descriptor.id);
          expect(callbacks.publishDroppables.mock.calls[0][0])
            .not.toContain(preset.foreign);

          // checking we are not causing an orphan child warning
          expect(console.error).not.toHaveBeenCalled();
        });

        // This should never happen - this test is just checking that the error logging is occurring
        it('should exclude orphaned children on the next collection', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          // unregistering the foreign droppable
          marshal.unregisterDroppable(preset.foreign.descriptor.id);
          expect(console.error).not.toHaveBeenCalled();
          // not unregistering children (bad)

          // lift, collect and publish
          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);
          executeCollectionAndPublish();

          // checking that none of the children in the foreign list where interacted with
          preset.inForeignList.forEach((dimension: DraggableDimension) => {
            expect(watchers.draggable.getDimension)
              .not.toHaveBeenCalledWith(dimension.descriptor.id);
          });

          // this should cause an orphan child warning
          expect(console.error).toHaveBeenCalledTimes(preset.inForeignList.length);
        });
      });

      describe('draggable', () => {
        it('should log an error if there is no entry with a matching id', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.unregisterDraggable(preset.home.descriptor.id);

          expect(console.error).toHaveBeenCalled();
        });

        it('should remove the dimension if it exists', () => {
          const marshal = createDimensionMarshal(getCallbackStub());
          const watchers = populateMarshal(marshal);

          marshal.unregisterDraggable(preset.inForeign1.descriptor.id);
          expect(console.error).not.toHaveBeenCalled();

          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);
          executeCollectionAndPublish();

          expect(watchers.draggable.getDimension)
            .not.toHaveBeenCalledWith(preset.inForeign1.descriptor.id);
        });
      });
    });
  });

  describe('registration change while collecting', () => {
    describe('dimension added', () => {
      describe('draggable', () => {
        it('should immediately publish the draggable', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);
          const fake: DraggableDimension = getDraggableDimension({
            descriptor: {
              id: 'my fake id',
              droppableId: preset.home.descriptor.id,
              index: preset.inHomeList.length,
            },
            clientRect: fakeClientRect,
          });

          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);

          marshal.registerDraggable(fake.descriptor, () => fake);
          expect(callbacks.publishDraggables).toHaveBeenCalledWith([fake]);
        });
      });

      describe('droppable', () => {
        it('should immediately publish the droppable', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);
          const fake: DroppableDimension = getDroppableDimension({
            descriptor: {
              id: 'my fake id',
              type: preset.home.descriptor.type,
            },
            clientRect: fakeClientRect,
          });
          const droppableCallbacks: DroppableCallbacks = {
            getDimension: () => fake,
            watchScroll: jest.fn(),
            unwatchScroll: () => { },
          };

          marshal.onStateChange(phase.requesting, preset.inHome1.descriptor);

          marshal.registerDroppable(fake.descriptor, droppableCallbacks);
          expect(callbacks.publishDroppables).toHaveBeenCalledWith([fake]);
          // should subscribe to scrolling immediately
          expect(droppableCallbacks.watchScroll).toHaveBeenCalled();
        });
      });
    });
  });
});
