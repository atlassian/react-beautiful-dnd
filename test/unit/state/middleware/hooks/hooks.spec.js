// @flow
import middleware from '../../../../../src/state/middleware/hooks';
import { add } from '../../../../../src/state/position';
import {
  prepare,
  initialPublish,
  bulkReplace,
  completeDrop,
  move,
  moveForward,
  type InitialPublishArgs,
  type MoveArgs,
} from '../../../../../src/state/action-creators';
import createStore from '../create-store';
import { getPreset } from '../../../../utils/dimension';
import getViewport from '../../../../../src/view/window/get-viewport';
import type {
  Store,
  Hooks,
  Announce,
  Critical,
  DragStart,
  DragUpdate,
  DropResult,
  Viewport,
} from '../../../../../src/types';

const preset = getPreset();

const createHooks = (): Hooks => ({
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

const getAnnounce = (): Announce => jest.fn();

// Using the same scroll as the preset
const viewport: Viewport = {
  ...getViewport(),
  scroll: preset.windowScroll,
};

const initialPublishArgs: InitialPublishArgs = {
  critical: {
    draggable: preset.inHome1.descriptor,
    droppable: preset.home.descriptor,
  },
  dimensions: preset.dimensions,
  client: {
    selection: preset.inHome1.client.borderBox.center,
    borderBoxCenter: preset.inHome1.client.borderBox.center,
    offset: { x: 0, y: 0 },
  },
  viewport,
  autoScrollMode: 'FLUID',
};

const getDragStart = (critical: Critical): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: {
    droppableId: critical.droppable.id,
    index: critical.draggable.index,
  },
});

describe('start', () => {
  it('should call the onDragStart hook when a initial publish occurs', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    // prepare step should not trigger hook
    store.dispatch(prepare());
    expect(hooks.onDragStart).not.toHaveBeenCalled();

    // first initial publish
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledWith(
      getDragStart(initialPublishArgs.critical),
      expect.any(Object),
    );
  });

  it('should throw an exception if an initial publish is called before a drag ends', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    const execute = () => {
      store.dispatch(initialPublish(initialPublishArgs));
    };
    // first execution is all good
    execute();
    expect(hooks.onDragStart).toHaveBeenCalled();

    // should not happen
    expect(execute).toThrow();
  });
});

describe('drop', () => {
  it('should call the onDragEnd hook when a DROP_COMPLETE action occurs', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    store.dispatch(bulkReplace({
      dimensions: preset.dimensions,
      viewport,
      shouldReplaceCritical: false,
    }));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);

    const result: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 2,
      },
      reason: 'DROP',
    };
    store.dispatch(completeDrop(result));
    expect(hooks.onDragEnd).toHaveBeenCalledWith(result, expect.any(Object));
  });

  it('should throw an exception if there was no drag start published', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    const result: DropResult = {
      ...getDragStart(initialPublishArgs.critical),
      destination: {
        droppableId: preset.home.descriptor.id,
        index: 2,
      },
      reason: 'DROP',
    };

    // throws when in idle
    expect(() => store.dispatch(completeDrop(result))).toThrow();

    // throws if trying to drop while preparing
    store.dispatch(prepare());
    expect(() => store.dispatch(completeDrop(result))).toThrow();
  });
});

describe('update', () => {
  it.only('should call onDragUpdate if the position has changed on move', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(bulkReplace({
      dimensions: preset.dimensions,
      viewport,
      shouldReplaceCritical: false,
    }));
    // not called yet as position has not changed
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // Okay let's move it
    store.dispatch(moveForward());
    const update: DragUpdate = {
      ...getDragStart(initialPublishArgs.critical),
      destination: {
        droppableId: initialPublishArgs.critical.droppable.id,
        index: initialPublishArgs.critical.draggable.index + 1,
      },
    };
    expect(hooks.onDragUpdate).toHaveBeenCalledWith(
      update,
      expect.any(Object),
    );
  });

  it('should call onDragUpdate if the position has changed due to a bulk publish', () => {

  });

  it('should not call onDragUpdate if the position has not changed from the initial publish', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    store.dispatch(prepare());
    store.dispatch(initialPublish(initialPublishArgs));
    expect(hooks.onDragStart).toHaveBeenCalledTimes(1);
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    store.dispatch(bulkReplace({
      dimensions: preset.dimensions,
      viewport,
      shouldReplaceCritical: false,
    }));
    // not called yet as position has not changed
    expect(hooks.onDragUpdate).not.toHaveBeenCalled();

    // A movement to the same index is not causing an update
    const moveArgs: MoveArgs = {
      // tiny change
      client: add(initialPublishArgs.client.selection, { x: 1, y: 1 }),
      shouldAnimate: true,
    };
    store.dispatch(move(moveArgs));

    expect(hooks.onDragUpdate).not.toHaveBeenCalled();
  });

  it('should not call onDragUpdate if there is no movement from the last update', () => {

  });
});

describe('abort', () => {
  it('should use the last published critical descriptor', () => {

  });

  it('should publish an on drag end with no destination even if there is a current destination', () => {

  });

  it('should not do anything if a drag start had not been published', () => {

  });
});

describe('announcements', () => {

});
