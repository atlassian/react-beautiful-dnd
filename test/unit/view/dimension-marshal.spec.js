// @flow
import { type Spacing } from 'css-box-model';
import { getPreset, getDraggableDimension, getDroppableDimension } from '../../utils/dimension';
import createDimensionMarshal from '../../../src/state/dimension-marshal/dimension-marshal';
import getStatePreset from '../../utils/get-simple-state-preset';
import type {
  Callbacks,
  DimensionMarshal,
  DroppableCallbacks,
  GetDraggableDimensionFn,
} from '../../../src/state/dimension-marshal/dimension-marshal-types';
import type {
  State,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableId,
  DroppableId,
  DraggableDescriptor,
  DroppableDescriptor,
  ScrollOptions,
} from '../../../src/types';

const getCallbackStub = (): Callbacks => {
  const callbacks: Callbacks = {
    cancel: jest.fn(),
    publishDraggable: jest.fn(),
    publishDroppable: jest.fn(),
    bulkPublish: jest.fn(),
    updateDroppableScroll: jest.fn(),
    updateDroppableIsEnabled: jest.fn(),
  };
  return callbacks;
};

type PopulateMarshalState = {|
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
|}

const preset = getPreset();
const state = getStatePreset();

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
      watchScroll: (options: ScrollOptions) => {
        watches.droppable.watchScroll(id, options);
      },
      unwatchScroll: () => {
        watches.droppable.unwatchScroll(id);
      },
      scroll: () => {},
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

const fakeBorderBox: Spacing = {
  top: 0, right: 100, bottom: 100, left: 0,
};

const ofAnotherType: DroppableDimension = getDroppableDimension({
  descriptor: {
    id: 'of-another-type',
    type: 'another-type',
  },
  borderBox: fakeBorderBox,
});
const childOfAnotherType: DraggableDimension = getDraggableDimension({
  descriptor: {
    id: 'addition',
    droppableId: ofAnotherType.descriptor.id,
    index: 0,
  },
  borderBox: fakeBorderBox,
});

const immediate: ScrollOptions = {
  shouldPublishImmediately: true,
};
const scheduled: ScrollOptions = {
  shouldPublishImmediately: false,
};

const withScrollOptions = (current: State, scrollOptions: ScrollOptions) => {
  if (!current.dimension.request) {
    throw new Error('Invalid test setup');
  }

  return {
    ...current,
    dimension: {
      ...current.dimension,
      request: {
        ...current.dimension.request,
        scrollOptions,
      },
    },
  };
};

describe('dimension marshal', () => {
  beforeAll(() => {
    requestAnimationFrame.reset();
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  afterEach(() => {
    requestAnimationFrame.reset();
    jest.useRealTimers();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('drag starting (including early cancel)', () => {
    describe('invalid start state', () => {
      it('should cancel the collecting if already collecting', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting());
        marshal.onPhaseChange(state.requesting());

        expect(callbacks.cancel).toHaveBeenCalled();
      });

      it('should cancel the collection if the draggable cannot be found', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting({
          draggableId: 'some-unknown-descriptor',
          scrollOptions: scheduled,
        }));

        expect(callbacks.cancel).toHaveBeenCalled();
      });

      it('should cancel the collection if the home droppable cannot be found', () => {
        const droppables: DroppableDimensionMap = {
          ...preset.droppables,
        };
        // removing preset.home from the droppables
        delete droppables[preset.home.descriptor.id];
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal, {
          draggables: preset.draggables,
          droppables,
        });

        // there is now no published home droppable
        marshal.onPhaseChange(state.requesting({
          draggableId: preset.inHome1.descriptor.id,
          scrollOptions: scheduled,
        }));

        expect(callbacks.cancel).toHaveBeenCalled();
      });
    });

    describe('pre drag start actions', () => {
      it('should publish the home droppable and dragging item', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting({
          draggableId: preset.inHome1.descriptor.id,
          scrollOptions: scheduled,
        }));

        expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDraggable).toBeCalledWith(preset.inHome1);
        expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
        expect(callbacks.publishDroppable).toBeCalledWith(preset.home);
        expect(callbacks.bulkPublish).not.toHaveBeenCalled();
      });

      it('should ask the home droppable to start listening to scrolling (scheduled scroll)', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        const watches = populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting({
          draggableId: preset.inHome1.descriptor.id,
          scrollOptions: scheduled,
        }));

        // it should not watch scroll on the other droppables at this stage
        expect(watches.droppable.watchScroll).toHaveBeenCalledTimes(1);
        expect(watches.droppable.watchScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id,
          scheduled,
        );
      });

      it('should ask the home droppable to start listening to scrolling (immediate scroll)', () => {
        const callbacks = getCallbackStub();
        const marshal = createDimensionMarshal(callbacks);
        const watches = populateMarshal(marshal);

        marshal.onPhaseChange(state.requesting({
          draggableId: preset.inHome1.descriptor.id,
          scrollOptions: immediate,
        }));

        // it should not watch scroll on the other droppables at this stage
        expect(watches.droppable.watchScroll).toHaveBeenCalledTimes(1);
        expect(watches.droppable.watchScroll).toHaveBeenCalledWith(
          preset.home.descriptor.id,
          immediate,
        );
      });
    });

    describe('post drag start actions', () => {
      describe('before the first frame', () => {
        it('should not do anything if the drag was cancelled before a drag started', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
          callbacks.publishDraggable.mockReset();
          callbacks.publishDroppable.mockReset();
          // moving to idle state before moving to dragging state
          marshal.onPhaseChange(state.idle);

          // flushing any timers
          jest.runAllTimers();
          requestAnimationFrame.flush();

          // nothing happened
          expect(callbacks.bulkPublish).not.toHaveBeenCalled();
          expect(callbacks.publishDroppable).not.toHaveBeenCalled();
          expect(callbacks.publishDraggable).not.toHaveBeenCalled();
        });
      });

      describe('in the first frame (the collection frame)', () => {
        it('should not do anything if the drag was cancelled before the frame executed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.bulkPublish).not.toHaveBeenCalled();
          callbacks.publishDroppable.mockClear();
          callbacks.publishDraggable.mockClear();
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          // an animation frame is now pending - cancel drag before it starts
          marshal.onPhaseChange(state.idle);

          // flush all timers - would normally collect and publish
          requestAnimationFrame.flush();

          expect(callbacks.publishDraggable).not.toHaveBeenCalled();
          expect(watchers.droppable.getDimension).not.toHaveBeenCalled();
        });

        it('should collect all of the dimensions', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(1);
          expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(1);
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step();

          // all dimensions have been collected
          // length -1 as the initial dimensions have already been collected
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(preset.draggables).length - 1);
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledTimes(Object.keys(preset.droppables).length - 1);
        });

        it('should collect dimensions have the same type as the dragging item', () => {
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

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // clearing the initial calls
          watchers.draggable.getDimension.mockClear();
          watchers.droppable.getDimension.mockClear();

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
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

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          // called straight away
          expect(watchers.draggable.getDimension)
            .toHaveBeenCalledWith(preset.inHome1.descriptor.id);
          // clear the watchers state
          watchers.draggable.getDimension.mockClear();

          // will trigger the collection
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step();

          expect(watchers.draggable.getDimension).toHaveBeenCalled();
          expect(watchers.draggable.getDimension)
            .not.toHaveBeenCalledWith(preset.inHome1.descriptor.id);
        });

        it('should not collect the home droppable dimension as it has already been collected', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          // called straight away
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledWith(preset.home.descriptor.id);
          // clear the watchers state
          watchers.droppable.getDimension.mockClear();

          // will trigger the collection
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step();

          expect(watchers.droppable.getDimension).toHaveBeenCalled();
          expect(watchers.droppable.getDimension)
            .not.toHaveBeenCalledWith(preset.home.descriptor.id);
        });

        it('should cancel the drag if the current dragging item does not match the requested item', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          // called straight away
          expect(watchers.droppable.getDimension)
            .toHaveBeenCalledWith(preset.home.descriptor.id);
          // clear the watchers state
          watchers.droppable.getDimension.mockClear();
          watchers.draggable.getDimension.mockClear();

          // a different descriptor
          marshal.onPhaseChange(state.dragging(preset.inHome2.descriptor.id));

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

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // clearing initial calls
          callbacks.publishDraggable.mockClear();
          callbacks.publishDroppable.mockClear();

          // execute collection frame
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step();

          // cancelled before second frame fired
          marshal.onPhaseChange(state.idle);
          requestAnimationFrame.step();

          // nothing additional called
          expect(callbacks.publishDraggable).not.toHaveBeenCalled();
          expect(callbacks.publishDroppable).not.toHaveBeenCalled();
          expect(callbacks.bulkPublish).not.toHaveBeenCalled();
        });

        it('should publish all the collected droppables', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          // calls are batched
          expect(callbacks.bulkPublish).toHaveBeenCalledTimes(1);
          const result: DroppableDimension[] = callbacks.bulkPublish.mock.calls[0][0];
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

        it('should publish all the collected draggables', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          // calls are batched
          expect(callbacks.bulkPublish).toHaveBeenCalledTimes(1);
          const result: DraggableDimension[] = callbacks.bulkPublish.mock.calls[0][1];

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

        [scheduled, immediate].forEach((scrollOptions: ScrollOptions) => {
          it('should request all the droppables to start listening to scroll events', () => {
            const callbacks = getCallbackStub();
            const marshal = createDimensionMarshal(callbacks);
            const watchers = populateMarshal(marshal);

            marshal.onPhaseChange(state.requesting({
              draggableId: preset.inHome1.descriptor.id,
              scrollOptions,
            }));
            // initial droppable
            expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(1);

            marshal.onPhaseChange(withScrollOptions(
              state.dragging(preset.inHome1.descriptor.id),
              scrollOptions,
            ));
            requestAnimationFrame.step(2);

            const expectedLength: number = Object.keys(preset.droppables).length;
            expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(expectedLength);

            Object.keys(preset.droppables).forEach((id: DroppableId) => {
              expect(watchers.droppable.watchScroll).toHaveBeenCalledWith(id, scrollOptions);
            });
          });
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
          populateMarshal(marshal, { draggables, droppables });

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(callbacks.bulkPublish.mock.calls[0][0]).not.toContain(ofAnotherType);
          // validation
          expect(callbacks.bulkPublish.mock.calls[0][0]).toContain(preset.foreign);

          expect(callbacks.bulkPublish.mock.calls[0][1]).not.toContain(childOfAnotherType);
          // validation
          expect(callbacks.bulkPublish.mock.calls[0][1]).toContain(preset.inHome2);
        });

        it('should not publish draggables if there are none to publish', () => {
          const droppables: DroppableDimensionMap = {
            [preset.home.descriptor.id]: preset.home,
            [preset.foreign.descriptor.id]: preset.foreign,
          };
          const draggables: DraggableDimensionMap = {
            [preset.inHome1.descriptor.id]: preset.inHome1,
          };
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, { draggables, droppables });

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // asserting initial lift occurred
          expect(callbacks.publishDraggable).toHaveBeenCalledWith(preset.inHome1);
          expect(callbacks.publishDroppable).toHaveBeenCalledWith(preset.home);

          // perform full lift
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(callbacks.bulkPublish).toHaveBeenCalledWith([preset.foreign], []);
        });

        it('should not publish droppables if there are none to publish', () => {
          const droppables: DroppableDimensionMap = {
            // one droppable
            [preset.home.descriptor.id]: preset.home,
          };
          const draggables: DraggableDimensionMap = {
            // dragging
            [preset.inHome1.descriptor.id]: preset.inHome1,
            // will be collected in second phase
            [preset.inHome2.descriptor.id]: preset.inHome2,
          };
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, { draggables, droppables });

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // asserting initial lift occurred
          expect(callbacks.publishDraggable).toHaveBeenCalledWith(preset.inHome1);
          expect(callbacks.publishDroppable).toHaveBeenCalledWith(preset.home);

          // perform full lift
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(callbacks.bulkPublish).toHaveBeenCalledWith([], [preset.inHome2]);
        });
      });
    });
  });

  describe('drag completed after initial collection', () => {
    it('should unwatch all the scroll events on droppables', () => {
      [
        state.idle,
        state.dropAnimating(preset.inHome1.descriptor.id),
        state.dropComplete(preset.inHome1.descriptor.id),
      ].forEach((finish: State) => {
        const marshal = createDimensionMarshal(getCallbackStub());
        const watchers = populateMarshal(marshal);

        // do initial work
        marshal.onPhaseChange(state.requesting({
          draggableId: preset.inHome1.descriptor.id,
          scrollOptions: scheduled,
        }));
        marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
        requestAnimationFrame.step(2);

        // currently watching
        Object.keys(preset.droppables).forEach((id: DroppableId) => {
          expect(watchers.droppable.watchScroll).toHaveBeenCalledWith(id, scheduled);
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
      callbacks.publishDraggable.mockClear();
      callbacks.publishDroppable.mockClear();
      callbacks.bulkPublish.mockClear();
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

    const shouldHaveProcessedInitialDimensions = (scrollOptions: ScrollOptions): void => {
      expect(callbacks.publishDroppable).toHaveBeenCalledWith(preset.home);
      expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
      expect(callbacks.publishDraggable).toHaveBeenCalledWith(preset.inHome1);
      expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
      expect(callbacks.bulkPublish).not.toHaveBeenCalled();
      expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(1);
      expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(1);
      expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(1);
      expect(watchers.droppable.watchScroll).toHaveBeenCalledWith(
        preset.home.descriptor.id, scrollOptions
      );
      expect(watchers.droppable.unwatchScroll).not.toHaveBeenCalled();
    };

    const shouldNotHavePublishedDimensions = (): void => {
      expect(callbacks.publishDroppable).not.toHaveBeenCalled();
      expect(callbacks.publishDroppable).not.toHaveBeenCalled();
      expect(callbacks.bulkPublish).not.toHaveBeenCalled();
    };

    [immediate, scheduled].forEach((scrollOptions: ScrollOptions) => {
      it('should support subsequent drags after a completed collection', () => {
        Array.from({ length: 4 }).forEach(() => {
          // initial publish
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions,
          }));

          shouldHaveProcessedInitialDimensions(scrollOptions);

          // resetting mock state so future assertions do not include these calls
          resetMocks();

          // collection and publish of secondary dimensions
          marshal.onPhaseChange(withScrollOptions(
            state.dragging(preset.inHome1.descriptor.id),
            scrollOptions,
          ));
          requestAnimationFrame.step(2);

          expect(callbacks.publishDroppable).not.toHaveBeenCalled();
          expect(callbacks.publishDraggable).not.toHaveBeenCalled();
          expect(callbacks.bulkPublish).toHaveBeenCalledTimes(1);
          expect(watchers.droppable.getDimension).toHaveBeenCalledTimes(droppableCount - 1);
          expect(watchers.droppable.watchScroll).toHaveBeenCalledTimes(droppableCount - 1);
          expect(watchers.draggable.getDimension).toHaveBeenCalledTimes(draggableCount - 1);
          expect(watchers.droppable.unwatchScroll).not.toHaveBeenCalled();

          // finish the collection
          marshal.onPhaseChange(state.dropComplete(preset.inHome1.descriptor.id));

          expect(watchers.droppable.unwatchScroll).toHaveBeenCalledTimes(droppableCount);

          resetMocks();
        });
      });

      it('should support subsequent drags after a cancelled dimension request', () => {
        Array.from({ length: 4 }).forEach(() => {
          // start the collection
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions,
          }));

          shouldHaveProcessedInitialDimensions(scrollOptions);
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
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions,
          }));

          shouldHaveProcessedInitialDimensions(scrollOptions);
          resetMocks();

          // drag started but collection not started
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));

          shouldNotHavePublishedDimensions();

          // cancelled
          marshal.onPhaseChange(state.idle);
          resetMocks();
        });
      });

      it('should support subsequent drags after a cancelled collection', () => {
        Array.from({ length: 4 }).forEach(() => {
          // start the collection
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions,
          }));

          shouldHaveProcessedInitialDimensions(scrollOptions);
          resetMocks();

          // drag started but collection not started
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          // executing collection step but not publish
          requestAnimationFrame.step();

          shouldNotHavePublishedDimensions();

          // cancelled
          marshal.onPhaseChange(state.idle);
          resetMocks();
        });
      });
    });
  });

  describe('registration change while not collecting', () => {
    const droppableCallbacks: DroppableCallbacks = {
      getDimension: () => preset.home,
      watchScroll: () => { },
      unwatchScroll: () => { },
      scroll: () => {},
    };
    const getDraggableDimensionFn: GetDraggableDimensionFn = () => preset.inHome1;

    describe('dimension added', () => {
      describe('droppable', () => {
        it('should be published in the next collection', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables: {}, droppables: {},
          });

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          expect(callbacks.publishDroppable).toHaveBeenCalledWith(preset.home);
        });

        it('should overwrite an existing entry if needed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables: {}, droppables: {},
          });

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          const newHomeDescriptor: DroppableDescriptor = {
            id: preset.home.descriptor.id,
            type: preset.home.descriptor.type,
          };
          const newCallbacks: DroppableCallbacks = {
            getDimension: () => preset.foreign,
            watchScroll: () => { },
            unwatchScroll: () => { },
            scroll: () => { },
          };
          marshal.registerDroppable(newHomeDescriptor, newCallbacks);
          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          expect(callbacks.publishDroppable).toHaveBeenCalledWith(preset.foreign);
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
        });
      });

      describe('draggable', () => {
        it('should not log an error if there is no matching droppable (children are mounted before parents in React 16)', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          expect(console.error).not.toHaveBeenCalled();
        });

        it('should be published in the next collection', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables: {}, droppables: {},
          });

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          expect(callbacks.publishDraggable).toHaveBeenCalledWith(preset.inHome1);
        });

        it('should overwrite an existing entry if needed', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            draggables: {}, droppables: {},
          });

          marshal.registerDroppable(preset.home.descriptor, droppableCallbacks);
          marshal.registerDraggable(preset.inHome1.descriptor, getDraggableDimensionFn);
          // registration with a descriptor with the same id
          // this is faking the situation where an item has moved
          // to a new droppable before the old draggable has been unmounted
          const fake: DraggableDescriptor = {
            id: preset.inHome1.descriptor.id,
            droppableId: preset.inHome2.descriptor.droppableId,
            index: preset.inHome1.descriptor.index + 10,
          };
          marshal.registerDraggable(fake, () => preset.inHome2);
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDraggable).toHaveBeenCalledWith(preset.inHome2);
        });
      });
    });

    describe('dimension removed', () => {
      describe('droppable', () => {
        it('should log an error if there is no entry with a matching id', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.unregisterDroppable(preset.home.descriptor);

          expect(console.error).toHaveBeenCalled();
        });

        it('should not error if the droppable still has registered draggables', () => {
          // Even though this leaves orphans, the in react the parent is unmounted before the child
          // removing foreign droppable
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          // unregistering the foreign droppable without unregistering its children
          marshal.unregisterDroppable(preset.foreign.descriptor);
          expect(console.warn).not.toHaveBeenCalled();
        });

        it('should remove the dimension if it exists', () => {
          // removing foreign droppable
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          // unregistering the foreign droppable
          marshal.unregisterDroppable(preset.foreign.descriptor);
          // unregistering all children to prevent orphan children log
          preset.inForeignList.forEach((dimension: DraggableDimension) => {
            marshal.unregisterDraggable(dimension.descriptor);
          });
          expect(console.warn).not.toHaveBeenCalled();

          // lift, collect and publish
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));

          // execute full lift
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(watchers.droppable.getDimension)
            .not.toHaveBeenCalledWith(preset.foreign.descriptor.id);
          expect(callbacks.bulkPublish.mock.calls[0][0])
            .not.toContain(preset.foreign);
          // validation
          expect(callbacks.bulkPublish.mock.calls[0][0]).toContain(preset.emptyForeign);

          // checking we are not causing an orphan child warning
          expect(console.warn).not.toHaveBeenCalled();
        });

        // This should never happen - this test is just checking that the error logging is occurring
        it('should exclude orphaned children on the next collection', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          const watchers = populateMarshal(marshal);

          // unregistering the foreign droppable
          marshal.unregisterDroppable(preset.foreign.descriptor);
          expect(console.warn).not.toHaveBeenCalled();
          // not unregistering children (bad)

          // lift, collect and publish
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // perform full lift
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          // checking that none of the children in the foreign list where interacted with
          preset.inForeignList.forEach((dimension: DraggableDimension) => {
            expect(watchers.draggable.getDimension)
              .not.toHaveBeenCalledWith(dimension.descriptor.id);
          });

          // this should cause an orphan child warning
          expect(console.warn).toHaveBeenCalledTimes(preset.inForeignList.length);
        });

        it('should not remove an overwritten entry', () => {
          const callbacks: Callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);

          // registering initial dimensions
          const getOldDimension = jest.fn().mockImplementation(() => preset.home);
          marshal.registerDroppable(preset.home.descriptor, {
            getDimension: getOldDimension,
            watchScroll: () => { },
            unwatchScroll: () => { },
            scroll: () => { },
          });
          marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);

          // overwriting preset.home
          const newDimension: DroppableDimension = getDroppableDimension({
            descriptor: {
              id: preset.home.descriptor.id,
              type: preset.home.descriptor.type,
            },
            borderBox: {
              top: 0, left: 0, right: 100, bottom: 100,
            },
          });
          const getNewDimension = jest.fn().mockImplementation(() => newDimension);
          marshal.registerDroppable(newDimension.descriptor, {
            getDimension: getNewDimension,
            watchScroll: () => { },
            unwatchScroll: () => { },
            scroll: () => { },
          });

          // perform full lift
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(getNewDimension).toHaveBeenCalledTimes(1);
          expect(getOldDimension).not.toHaveBeenCalled();
        });
      });

      describe('draggable', () => {
        it('should log an error if there is no entry with a matching id', () => {
          const marshal = createDimensionMarshal(getCallbackStub());

          marshal.unregisterDraggable(preset.inHome1.descriptor);

          expect(console.error).toHaveBeenCalled();
        });

        it('should remove the dimension if it exists', () => {
          const marshal = createDimensionMarshal(getCallbackStub());
          const watchers = populateMarshal(marshal);

          marshal.unregisterDraggable(preset.inForeign1.descriptor);
          expect(console.error).not.toHaveBeenCalled();

          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // perform full lift
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(watchers.draggable.getDimension)
            .not.toHaveBeenCalledWith(preset.inForeign1.descriptor.id);
        });

        it('should not remove an overwritten entry', () => {
          const marshal = createDimensionMarshal(getCallbackStub());
          marshal.registerDroppable(preset.home.descriptor, {
            getDimension: () => preset.home,
            watchScroll: () => {},
            unwatchScroll: () => {},
            scroll: () => {},
          });
          const getOldDimension: GetDraggableDimensionFn =
            jest.fn().mockImplementation(() => preset.inHome2);

          // original registration
          marshal.registerDraggable(preset.inHome1.descriptor, () => preset.inHome1);
          marshal.registerDraggable(preset.inHome2.descriptor, getOldDimension);

          // registering new draggable with the same id as inHome2 before it is unregistered
          // same id but moved to new position
          const newDimension: DraggableDimension = getDraggableDimension({
            descriptor: {
              id: preset.inHome2.descriptor.id,
              droppableId: preset.inHome2.descriptor.droppableId,
              index: 400,
            },
            borderBox: {
              top: 0, left: 0, right: 100, bottom: 100,
            },
          });
          const getNewDimension: GetDraggableDimensionFn =
              jest.fn().mockImplementation(() => newDimension);
          marshal.registerDraggable(newDimension.descriptor, getNewDimension);

          // unregistering original inHome2
          marshal.unregisterDraggable(preset.inHome2.descriptor);

          // perform full lift
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          marshal.onPhaseChange(state.dragging(preset.inHome1.descriptor.id));
          requestAnimationFrame.step(2);

          expect(getNewDimension).toHaveBeenCalledTimes(1);
          expect(getOldDimension).not.toHaveBeenCalled();
        });
      });
    });
  });

  // Behaviour currently unsupported
  describe('registration change while collecting', () => {
    describe('dimension added', () => {
      describe('draggable', () => {
        it('should cancel the drag if the dimension is of the same type as the dragging item', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);
          const fake: DraggableDimension = getDraggableDimension({
            descriptor: {
              id: 'my fake id',
              droppableId: preset.home.descriptor.id,
              index: preset.inHomeList.length,
            },
            borderBox: fakeBorderBox,
          });

          // start a collection
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // initial publish has occurred
          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
          // cancel not called yet
          expect(callbacks.cancel).not.toHaveBeenCalled();

          // now registering new descriptor
          marshal.registerDraggable(fake.descriptor, () => fake);

          expect(callbacks.cancel).toHaveBeenCalled();
        });

        it('should not cancel the drag if the dimension is not of the same type as the dragging item', () => {
          const droppables: DroppableDimensionMap = {
            ...preset.droppables,
            [ofAnotherType.descriptor.id]: ofAnotherType,
          };
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            droppables,
            draggables: preset.draggables,
          });

          // start a collection
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // initial publish occurred
          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
          // cancel not called yet
          expect(callbacks.cancel).not.toHaveBeenCalled();

          // now registering new descriptor
          marshal.registerDraggable(childOfAnotherType.descriptor, () => childOfAnotherType);

          // because it was of another type it did not impact the drag
          expect(callbacks.cancel).not.toHaveBeenCalled();
        });
      });

      describe('droppable', () => {
        it('should cancel the drag if the droppable was of the same type as the dragging item', () => {
          const droppables: DroppableDimensionMap = {
            ...preset.droppables,
          };
          // removing the foreign droppable
          delete droppables.foreign;
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal, {
            droppables,
            draggables: preset.draggables,
          });

          // start a collection
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // initial publish has occurred
          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
          // cancel not called yet
          expect(callbacks.cancel).not.toHaveBeenCalled();

          // Add a new droppable of the same type
          const droppableCallbacks: DroppableCallbacks = {
            getDimension: () => preset.foreign,
            watchScroll: () => { },
            unwatchScroll: () => { },
            scroll: () => {},
          };
          marshal.registerDroppable(preset.foreign.descriptor, droppableCallbacks);

          expect(callbacks.cancel).toHaveBeenCalled();
        });

        it('should not cancel the drag if the droppable is a different type to the dragging item', () => {
          const callbacks = getCallbackStub();
          const marshal = createDimensionMarshal(callbacks);
          populateMarshal(marshal);

          // start a collection
          marshal.onPhaseChange(state.requesting({
            draggableId: preset.inHome1.descriptor.id,
            scrollOptions: scheduled,
          }));
          // initial publish has occurred
          expect(callbacks.publishDraggable).toHaveBeenCalledTimes(1);
          expect(callbacks.publishDroppable).toHaveBeenCalledTimes(1);
          // cancel not called yet
          expect(callbacks.cancel).not.toHaveBeenCalled();

          // Add a new droppable of a different type
          const droppableCallbacks: DroppableCallbacks = {
            getDimension: () => ofAnotherType,
            watchScroll: () => { },
            unwatchScroll: () => { },
            scroll: () => {},
          };
          marshal.registerDroppable(ofAnotherType.descriptor, droppableCallbacks);

          expect(callbacks.cancel).not.toHaveBeenCalled();
        });
      });
    });

    describe('dimension changed', () => {
      // TODO: but same code path as dimension added
    });
  });

  describe('droppable scroll change', () => {
    it('should log an error if it a registration for the droppable cannot be found', () => {
      const callbacks: Callbacks = getCallbackStub();
      const marshal = createDimensionMarshal(callbacks);

      marshal.updateDroppableScroll(preset.home.descriptor.id, { x: 100, y: 230 });

      expect(console.error).toHaveBeenCalled();
      expect(callbacks.updateDroppableScroll).not.toHaveBeenCalled();
    });

    it('should not publish anything if not collecting', () => {
      const callbacks: Callbacks = getCallbackStub();
      const marshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.updateDroppableScroll(preset.home.descriptor.id, { x: 100, y: 230 });

      expect(console.error).not.toHaveBeenCalled();
      expect(callbacks.updateDroppableScroll).not.toHaveBeenCalled();
    });

    it('should publish the change if collecting', () => {
      const callbacks: Callbacks = getCallbackStub();
      const marshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.onPhaseChange(state.requesting());
      marshal.updateDroppableScroll(preset.home.descriptor.id, { x: 100, y: 230 });

      expect(callbacks.updateDroppableScroll)
        .toHaveBeenCalledTimes(1);
      expect(callbacks.updateDroppableScroll)
        .toHaveBeenCalledWith(preset.home.descriptor.id, { x: 100, y: 230 });
    });
  });

  describe('droppable enabled change', () => {
    it('should log an error if it a registration for the droppable cannot be found', () => {
      const callbacks: Callbacks = getCallbackStub();
      const marshal = createDimensionMarshal(callbacks);

      marshal.updateDroppableIsEnabled(preset.home.descriptor.id, false);

      expect(console.error).toHaveBeenCalled();
      expect(callbacks.updateDroppableIsEnabled).not.toHaveBeenCalled();
    });

    it('should not publish anything if not collecting', () => {
      const callbacks: Callbacks = getCallbackStub();
      const marshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.updateDroppableIsEnabled(preset.home.descriptor.id, false);

      expect(console.error).not.toHaveBeenCalled();
      expect(callbacks.updateDroppableIsEnabled).not.toHaveBeenCalled();
    });

    it('should publish the change if collecting', () => {
      const callbacks: Callbacks = getCallbackStub();
      const marshal = createDimensionMarshal(callbacks);
      populateMarshal(marshal);

      marshal.onPhaseChange(state.requesting({
        draggableId: preset.inHome1.descriptor.id,
        scrollOptions: scheduled,
      }));
      marshal.updateDroppableIsEnabled(preset.home.descriptor.id, false);

      expect(callbacks.updateDroppableIsEnabled)
        .toHaveBeenCalledTimes(1);
      expect(callbacks.updateDroppableIsEnabled)
        .toHaveBeenCalledWith(preset.home.descriptor.id, false);
    });
  });
});
