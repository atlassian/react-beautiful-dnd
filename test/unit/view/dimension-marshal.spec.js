// @flow
import { getPreset } from '../../utils/dimension';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import type {
  Callbacks,
  DimensionMarshal,
  DroppableCallbacks,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import typeimport { getDroppableDimension } from '../../../src/state/dimension';
 {
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
        const executeFirstFrame = () => {
          // lift timeout
          jest.runOnlyPendingTimers();
          // execute first frame - this should publish everything
          requestAnimationFrame.step();
        }

        it('should not do anything if the drag was cancelled before the frame executed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);

          // now fast forwarding lift timeout
          jest.runOnlyPendingTimers();
          // no animation frame has occurred yet
          // moving to idle state
          marshal.onStateChange(state.idle);
          // flushing all frames
          requestAnimationFrame.flush();

          // no change
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggables).toHaveBeenCalledTimes(1);
        });

        it('should collect all of the dimensions', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onStateChange(state.requesting);
          executeFirstFrame();

          // non-primary dimensions have not been published yet
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDroppables).toHaveBeenCalledTimes(1);
          // all dimensions have been collected
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(preset.draggables).length);
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(preset.droppables).length);
        });

        it('should not collect any droppables that do not have the same type as the dragging item', () => {
          const ofAnotherType: DroppableDimension = getDroppableDimension({
            descriptor: {
              id: 'of-another-type',
              type: 'another-type',
              displacementLimit: 10,
            },
            clientRect: getClientRect({
              top: 0, right: 100, bottom: 100, left: 0
            }),
          });
          const droppables: DroppableDimensionMap = {
            ...preset.droppables,
            [ofAnotherType.descriptor.id]: ofAnotherType,
          };
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal, {
            draggables: preset.draggables,
            droppables,
          });
          TODO

        });

        it('should not collect any draggables that do not have the same type as the dragging item', () => {

        });

        it('should not collect the dragging dimension as it has already been collected', () => {

        });

        it('should not collect the home droppable dimension as it has already been collected', () => {

        });
      });

      describe('in the second frame', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {

        });

        it('should publish all the collected droppable dimensions', () => {

        });

        it('should publish all the collected draggable dimensions', () => {

        });

        it('should request all the droppables to start listening to scroll events', () => {

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
