// @flow
import { getPreset } from '../../utils/dimension';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import { getDraggableDimension, getDroppableDimension } from '../../../src/state/dimension';
import getClientRect from '../../../src/state/get-client-rect';
import type {
  Callbacks,
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableId,
  DroppableId,
  State,
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

const populateMarshal = (marshal: DimensionMarshal, args?: PopulateMarshalState = defaultArgs): PopulateMarshalWatches => {
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

  const requesting: State = {
    phase: 'COLLECTING_INITIAL_DIMENSIONS',
    drag: null,
    drop: null,
    dimension: {
      request: preset.inHome1.descriptor,
      draggable: {},
      droppable: {},
    },
  };

  return { idle, requesting };
})();

const ofAnotherType: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'of-another-type',
    type: 'another-type',
  },
  clientRect: getClientRect({
    top: 0, right: 100, bottom: 100, left: 0,
  }),
});
const childOfAnotherType: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'addition',
    droppableId: ofAnotherType.descriptor.id,
    index: 0,
  },
  clientRect: getClientRect({
    top: 0, right: 100, bottom: 100, left: 0,
  }),
});

describe('dimension marshal', () => {
  beforeAll(() => {
    requestAnimationFrame.reset();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    requestAnimationFrame.reset();
    jest.useRealTimers();
  });

  describe('initial collection', () => {
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

        marshal.onStateChange(state.requesting);

        expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDraggables).toBeCalledWith([preset.inHome1]);
        expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDroppables).toBeCalledWith([preset.home]);
      });

      it('should ask the home droppable to start listening to scrolling', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        const watches = populateMarshal(marshal);

        marshal.onStateChange(state.requesting);

        // it should not watch scroll on the other droppables at this stage
        expect(watches.droppable.watchScroll).toHaveBeenCalledTimes(1);
        expect(watches.droppable.watchScroll).toHaveBeenCalledWith(preset.home.descriptor.id);
      });
    });

    describe('post drag start actions', () => {
      const executeFirstFrame = () => {
        // lift timeout
        jest.runOnlyPendingTimers();
        // execute first frame - this should publish everything
        requestAnimationFrame.step();
      };

      const executeSecondFrame = () => {
        // after the first frame, the second frame is just a single frame away
        requestAnimationFrame.step();
      };

      const executeFirstTwoFrames = () => {
        executeFirstFrame();
        executeSecondFrame();
      };

      describe('before the first frame', () => {
        it('should not do anything if the drag was cancelled before the lift timeout finished', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
          // moving to idle state
          marshal.onStateChange(state.idle);
          // something would normally happen
          jest.runAllTimers();
          requestAnimationFrame.flush();

          // nothing happened
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
        });
      });

      describe('in the first frame', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
          callbacks.publishDroppables.mockClear();
          callbacks.publishDraggables.mockClear();

          // now fast forwarding lift timeout
          jest.runOnlyPendingTimers();
          // no animation frame has occurred yet
          // moving to idle state
          marshal.onStateChange(state.idle);
          // flushing all frames
          requestAnimationFrame.flush();

          expect(callbacks.publishDraggables).not.toHaveBeenCalled();
        });

        it('should collect all of the dimensions', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(1);
          expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(1);
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          executeFirstFrame();

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

          marshal.onStateChange(state.requesting);
          // clearing the initial calls
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          executeFirstFrame();

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

          marshal.onStateChange(state.requesting);

          // called straight away
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledWith(preset.inHome1.descriptor.id);
          // clear the watchers state
          watchers.draggable.getDimension.mockClear();
          // will trigger the collection
          executeFirstFrame();

          expect(watchers.draggable.getDimension)
            .not.toHaveBeenCalledWith(preset.inHome1.descriptor.id);
        });

        it('should not collect the home droppable dimension as it has already been collected', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onStateChange(state.requesting);

          // called straight away
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledWith(preset.home.descriptor.id);
          // clear the watchers state
          watchers.droppable.getDimension.mockClear();
          // will trigger the collection
          executeFirstFrame();

          expect(watchers.droppable.getDimension)
            .not.toHaveBeenCalledWith(preset.home.descriptor.id);
        });
      });

      describe('in the second frame', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          // clearing initial calls
          callbacks.publishDraggables.mockClear();
          callbacks.publishDroppables.mockClear();
          executeFirstFrame();
          // cancelled before second frame fired
          marshal.onStateChange(state.idle);
          executeSecondFrame();

          // nothing additional called
          expect(callbacks.publishDraggables).not.toHaveBeenCalled();
          expect(callbacks.publishDroppables).not.toHaveBeenCalled();
        });

        it('should publish all the collected draggables', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          // clearing initial calls
          callbacks.publishDraggables.mockClear();

          executeFirstTwoFrames();

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

          marshal.onStateChange(state.requesting);
          // clearing initial calls
          callbacks.publishDroppables.mockClear();

          executeFirstTwoFrames();

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

          marshal.onStateChange(state.requesting);
          // initial droppable
          expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(1);
          // clearing this initial call
          watchers.droppable.watchScroll.mockClear();

          executeFirstTwoFrames();

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

          marshal.onStateChange(state.requesting);

          executeFirstTwoFrames();

          expect(callbacks.publishDroppables.mock.calls[0][0]).not.toContain(ofAnotherType);
          expect(callbacks.publishDraggables.mock.calls[0][0]).not.toContain(childOfAnotherType);
        });
      });
    });
  });

  describe('registration change while not collecting', () => {
    describe('dimension added', () => {
      describe('droppable', () => {
        it('should log an error if there is already an entry with the same id', () => {

        });

        it('should be published in the next collection', () => {

        });
      });

      describe('draggable', () => {
        it('should log an error if there is already an entry with the same id', () => {

        });

        it('should be published in the next collection', () => {

        });
      });
    });

    describe('dimension removed', () => {
      describe('droppable', () => {
        it('should log an error if there is no entry with a matching id', () => {

        });

        it('should not collect the entry on the next collection', () => {

        });
      });

      describe('draggable', () => {
        it('should log an error if there is no entry with a matching id', () => {

        });

        it('should not collect the entry on the next collection', () => {

        });
      });
    });
  });

  describe('registration change while collecting', () => {
    describe('dimension added', () => {
      describe('draggable', () => {
        it('should log an error if the dimension already existed', () => {

        });

        it('should immediately publish the draggable', () => {

        });
      });

      describe('droppable', () => {
        it('should log an error if the dimension already existed', () => {

        });

        it('should immediately publish the droppable', () => {

        });

        it('should request the droppable publish scroll updates', () => {

        });
      });
    });

    // This would need to work to support virtualisation
    describe('dimension removed (not currently supported)', () => {
      it('should cancel the drag when removing a draggable', () => {

      });
      it('should cancel the drag when removing a droppable', () => {

      });
    });
  });
});
