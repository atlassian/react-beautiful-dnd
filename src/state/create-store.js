// @flow
/* eslint-disable no-underscore-dangle */
import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducer';
import hookMiddleware from './hook-middleware';
import type { Store, Hooks } from '../types';

const composeEnhancers = typeof window === 'object'
  && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

export default (hooks: Hooks): Store => createStore(
  reducer,
  composeEnhancers(
    applyMiddleware(
      thunk,
      hookMiddleware(hooks),
      // debugging logger
      // require('./log-middleware').default,
    ),
  ),
);
