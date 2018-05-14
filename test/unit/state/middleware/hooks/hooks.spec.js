// @flow
import middleware from '../../../../../src/state/middleware/hooks';
import { prepare, initialPublish } from '../../../../../src/state/action-creators';
import createStore from '../create-store';
import type { Store, Hooks, Announce } from '../../../../../src/types';

const createHooks = (): Hooks => ({
  onDragStart: jest.fn(),
  onDragUpdate: jest.fn(),
  onDragEnd: jest.fn(),
});

const getAnnounce = (): Announce => jest.fn();

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
    store.dispatch(initialPublish({

    }));
    expect(hooks.onDragStart).toHaveBeenCalledWith({

    });
  });

  it('should throw an exception if an initial publish is called before a drag ends', () => {
    const hooks: Hooks = createHooks();
    const store: Store = createStore(
      middleware(() => hooks, getAnnounce())
    );

    const execute = () => {
      store.dispatch(initialPublish({

      }));
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

  });

  it('should call the onDragEnd with the drop reason', () => {

  });

  it('should throw an exception if there was no drag start published', () => {

  });
});

describe('update', () => {
  it('should call onDragUpdate if the position has changed', () => {

  });

  it('should not call onDragUpdate if the position has not changed from the last update', () => {

  });

  it('should not call onDragUpdate if there is no movement from the initial location', () => {

  });
});

describe('abort', () => {
  it('should use the last citical descriptor as the start location', () => {

  });

  it('should publish an on drag end with no destination even if there is a current destination', () => {

  });

  it('should not do anything if a drag start had not been published', () => {

  });
});

describe('announcements', () => {

});
