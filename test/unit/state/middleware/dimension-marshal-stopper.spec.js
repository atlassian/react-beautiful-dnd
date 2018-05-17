// @flow
import middleware from '../../../../src/state/middleware/dimension-marshal-stopper';

it('should stop a collection if a drag is aborted', () => {
  const mock = jest.fn();
  const getMarshal = () => ({
    stopPublishing: mock,
  });

  const store: Store = createStore(
    middleware(getMarshal),
  );
});

it('should stop a collection if a drag is dropped', () => {

});

it('should stop a collection if a drop is pending', () => {

});

it('should stop a collection if a drop does not need to animate and moves straight to complete', () => {

});
