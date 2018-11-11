// @flow
/* eslint-disable no-underscore-dangle */
import { applyMiddleware, createStore, compose } from 'redux';
import reducer from './reducer';
import lift from './middleware/lift';
import style from './middleware/style';
import drop from './middleware/drop/drop-middleware';
import hooks from './middleware/hooks/hooks-middleware';
import dropAnimationFinish from './middleware/drop-animation-finish';
import dimensionMarshalStopper from './middleware/dimension-marshal-stopper';
import autoScroll from './middleware/auto-scroll';
import pendingDrop from './middleware/pending-drop';
import updateViewportMaxScrollOnDestinationChange from './middleware/update-viewport-max-scroll-on-destination-change';
import type { DimensionMarshal } from './dimension-marshal/dimension-marshal-types';
import type { StyleMarshal } from '../view/style-marshal/style-marshal-types';
import type { AutoScroller } from './auto-scroller/auto-scroller-types';
import type { Hooks, Announce } from '../types';
import type { Store } from './store-types';

// We are checking if window is available before using it.
// This is needed for universal apps that render the component server side.
// Details: https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers =
  typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose;

type Args = {|
  getDimensionMarshal: () => DimensionMarshal,
  styleMarshal: StyleMarshal,
  getHooks: () => Hooks,
  announce: Announce,
  getScroller: () => AutoScroller,
|};

export default ({
  getDimensionMarshal,
  styleMarshal,
  getHooks,
  announce,
  getScroller,
}: Args): Store =>
  createStore(
    reducer,
    composeEnhancers(
      applyMiddleware(
        // ## Debug middleware

        // > uncomment to use
        // debugging logger
        // require('../debug/middleware/log').default,
        // user timing api
        // require('../debug/middleware/user-timing').default,
        // debugging timer
        // require('../debug/middleware/action-timing').default,
        // average action timer
        // require('../debug/middleware/action-timing-average').default(200),

        // ## Application middleware

        // Style updates do not cause more actions. It is important to update styles
        // before hooks are called: specifically the onDragEnd hook. We need to clear
        // the transition styles off the elements before a reorder to prevent strange
        // post drag animations in firefox. Even though we clear the transition off
        // a Draggable - if it is done after a reorder firefox will still apply the
        // transition.
        // Must be called before dimension marshal for lifting to apply collecting styles
        style(styleMarshal),
        // Stop the dimension marshal collecting anything
        // when moving into a phase where collection is no longer needed.
        // We need to stop the marshal before hooks fire as hooks can cause
        // dimension registration changes in response to reordering
        dimensionMarshalStopper(getDimensionMarshal),
        // Fire application hooks in response to drag changes
        lift(getDimensionMarshal),
        drop,
        // When a drop animation finishes - fire a drop complete
        dropAnimationFinish,
        pendingDrop,
        updateViewportMaxScrollOnDestinationChange,
        autoScroll(getScroller),
        // Fire hooks for consumers (after update to store)
        hooks(getHooks, announce),
      ),
    ),
  );
