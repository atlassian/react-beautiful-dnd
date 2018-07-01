// @flow
// This file exists to avoid a circular dependency between types.js and action-creators.js
import type { Store as ReduxStore, Dispatch as ReduxDispatch } from 'redux';
import type { Action as ActionCreators } from './action-creators';
import type { State } from '../types';

export type Action = ActionCreators;
export type Dispatch = ReduxDispatch<Action>;
export type Store = ReduxStore<State, Action, Dispatch>;
