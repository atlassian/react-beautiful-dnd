// @flow
import { createStore, compose, applyMiddleware } from 'redux';
import reducer from '../../../../../src/state/reducer';
import type { Store } from '../../../../../src/types';

export default (...middleware: mixed[]): Store => createStore(
  reducer,
  compose(
    applyMiddleware(...middleware)
  )
);

