// @flow
import { createStore, applyMiddleware } from 'redux';
import reducer from '../../../../../src/state/reducer';
import type { Store, Middleware } from '../../../../../src/state/store-types';

export default (...middleware: Middleware[]): Store =>
  createStore(reducer, applyMiddleware(...middleware));
