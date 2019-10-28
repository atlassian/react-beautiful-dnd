// @flow
import { useRef } from 'react';
import { type Position } from 'css-box-model';
import rafSchedule from 'raf-schd';
import { useMemo, useCallback } from 'use-memo-one';
import memoizeOne from 'memoize-one';
import { invariant } from '../../invariant';
import checkForNestedScrollContainers from './check-for-nested-scroll-container';
import * as dataAttr from '../data-attributes';
import { origin } from '../../state/position';
import getScroll from './get-scroll';
import type {
  DroppableEntry,
  DroppableCallbacks,
} from '../../state/registry/registry-types';
import getEnv, { type Env } from './get-env';
import type {
  Id,
  DroppableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollOptions,
  DroppableMode,
} from '../../types';
import getDimension from './get-dimension';
import AppContext, { type AppContextValue } from '../context/app-context';
import { warning } from '../../dev-warning';
import getListenerOptions from './get-listener-options';
import useRequiredContext from '../use-required-context';
import usePreviousRef from '../use-previous-ref';
import useLayoutEffect from '../use-isomorphic-layout-effect';
import useUniqueId from '../use-unique-id';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  mode: DroppableMode,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  ignoreContainerClipping: boolean,
  getDroppableRef: () => ?HTMLElement,
|};

type WhileDragging = {|
  ref: HTMLElement,
  descriptor: DroppableDescriptor,
  env: Env,
  scrollOptions: ScrollOptions,
|};

const getClosestScrollableFromDrag = (dragging: ?WhileDragging): ?Element =>
  (dragging && dragging.env.closestScrollable) || null;

export default function useDroppablePublisher(args: Props) {
  const whileDraggingRef = useRef<?WhileDragging>(null);
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const uniqueId: Id = useUniqueId('droppable');
  const { registry, marshal } = appContext;
  const previousRef = usePreviousRef(args);

  const descriptor = useMemo<DroppableDescriptor>(
    () => ({
      id: args.droppableId,
      type: args.type,
      mode: args.mode,
    }),
    [args.droppableId, args.mode, args.type],
  );
  const publishedDescriptorRef = useRef<DroppableDescriptor>(descriptor);

  const memoizedUpdateScroll = useMemo(
    () =>
      memoizeOne((x: number, y: number) => {
        invariant(
          whileDraggingRef.current,
          'Can only update scroll when dragging',
        );
        const scroll: Position = { x, y };
        marshal.updateDroppableScroll(descriptor.id, scroll);
      }),
    [descriptor.id, marshal],
  );

  const getClosestScroll = useCallback((): Position => {
    const dragging: ?WhileDragging = whileDraggingRef.current;
    if (!dragging || !dragging.env.closestScrollable) {
      return origin;
    }

    return getScroll(dragging.env.closestScrollable);
  }, []);

  const updateScroll = useCallback(() => {
    // reading scroll value when called so value will be the latest
    const scroll: Position = getClosestScroll();
    memoizedUpdateScroll(scroll.x, scroll.y);
  }, [getClosestScroll, memoizedUpdateScroll]);

  const scheduleScrollUpdate = useMemo(() => rafSchedule(updateScroll), [
    updateScroll,
  ]);

  const onClosestScroll = useCallback(() => {
    const dragging: ?WhileDragging = whileDraggingRef.current;
    const closest: ?Element = getClosestScrollableFromDrag(dragging);

    invariant(
      dragging && closest,
      'Could not find scroll options while scrolling',
    );
    const options: ScrollOptions = dragging.scrollOptions;
    if (options.shouldPublishImmediately) {
      updateScroll();
      return;
    }
    scheduleScrollUpdate();
  }, [scheduleScrollUpdate, updateScroll]);

  const getDimensionAndWatchScroll = useCallback(
    (windowScroll: Position, options: ScrollOptions) => {
      invariant(
        !whileDraggingRef.current,
        'Cannot collect a droppable while a drag is occurring',
      );
      const previous: Props = previousRef.current;
      const ref: ?HTMLElement = previous.getDroppableRef();
      invariant(ref, 'Cannot collect without a droppable ref');
      const env: Env = getEnv(ref);

      const dragging: WhileDragging = {
        ref,
        descriptor,
        env,
        scrollOptions: options,
      };
      // side effect
      whileDraggingRef.current = dragging;

      const dimension: DroppableDimension = getDimension({
        ref,
        descriptor,
        env,
        windowScroll,
        direction: previous.direction,
        isDropDisabled: previous.isDropDisabled,
        isCombineEnabled: previous.isCombineEnabled,
        shouldClipSubject: !previous.ignoreContainerClipping,
      });

      const scrollable: ?Element = env.closestScrollable;

      if (scrollable) {
        scrollable.setAttribute(
          dataAttr.scrollContainer.contextId,
          appContext.contextId,
        );

        // bind scroll listener
        scrollable.addEventListener(
          'scroll',
          onClosestScroll,
          getListenerOptions(dragging.scrollOptions),
        );
        // print a debug warning if using an unsupported nested scroll container setup
        if (process.env.NODE_ENV !== 'production') {
          checkForNestedScrollContainers(scrollable);
        }
      }

      return dimension;
    },
    [appContext.contextId, descriptor, onClosestScroll, previousRef],
  );

  const getScrollWhileDragging = useCallback((): Position => {
    const dragging: ?WhileDragging = whileDraggingRef.current;
    const closest: ?Element = getClosestScrollableFromDrag(dragging);
    invariant(
      dragging && closest,
      'Can only recollect Droppable client for Droppables that have a scroll container',
    );

    return getScroll(closest);
  }, []);

  const dragStopped = useCallback(() => {
    const dragging: ?WhileDragging = whileDraggingRef.current;
    invariant(dragging, 'Cannot stop drag when no active drag');
    const closest: ?Element = getClosestScrollableFromDrag(dragging);

    // goodbye old friend
    whileDraggingRef.current = null;

    if (!closest) {
      return;
    }

    // unwatch scroll
    scheduleScrollUpdate.cancel();
    closest.removeAttribute(dataAttr.scrollContainer.contextId);
    closest.removeEventListener(
      'scroll',
      onClosestScroll,
      getListenerOptions(dragging.scrollOptions),
    );
  }, [onClosestScroll, scheduleScrollUpdate]);

  const scroll = useCallback((change: Position) => {
    // arrange
    const dragging: ?WhileDragging = whileDraggingRef.current;
    invariant(dragging, 'Cannot scroll when there is no drag');
    const closest: ?Element = getClosestScrollableFromDrag(dragging);
    invariant(closest, 'Cannot scroll a droppable with no closest scrollable');

    // act
    closest.scrollTop += change.y;
    closest.scrollLeft += change.x;
  }, []);

  const callbacks: DroppableCallbacks = useMemo(() => {
    return {
      getDimensionAndWatchScroll,
      getScrollWhileDragging,
      dragStopped,
      scroll,
    };
  }, [dragStopped, getDimensionAndWatchScroll, getScrollWhileDragging, scroll]);

  const entry: DroppableEntry = useMemo(
    () => ({
      uniqueId,
      descriptor,
      callbacks,
    }),
    [callbacks, descriptor, uniqueId],
  );

  // Register with the marshal and let it know of:
  // - any descriptor changes
  // - when it unmounts
  useLayoutEffect(() => {
    publishedDescriptorRef.current = entry.descriptor;
    registry.droppable.register(entry);

    return () => {
      if (whileDraggingRef.current) {
        warning(
          'Unsupported: changing the droppableId or type of a Droppable during a drag',
        );
        dragStopped();
      }

      registry.droppable.unregister(entry);
    };
  }, [callbacks, descriptor, dragStopped, entry, marshal, registry.droppable]);

  // update is enabled with the marshal
  // only need to update when there is a drag
  useLayoutEffect(() => {
    if (!whileDraggingRef.current) {
      return;
    }
    marshal.updateDroppableIsEnabled(
      publishedDescriptorRef.current.id,
      !args.isDropDisabled,
    );
  }, [args.isDropDisabled, marshal]);

  // update is combine enabled with the marshal
  // only need to update when there is a drag
  useLayoutEffect(() => {
    if (!whileDraggingRef.current) {
      return;
    }
    marshal.updateDroppableIsCombineEnabled(
      publishedDescriptorRef.current.id,
      args.isCombineEnabled,
    );
  }, [args.isCombineEnabled, marshal]);
}
