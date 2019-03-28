// @flow
import { useCallback, useMemo, useLayoutEffect, useRef } from 'react';
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import rafSchedule from 'raf-schd';
import checkForNestedScrollContainers from './check-for-nested-scroll-container';
import { origin } from '../../state/position';
import getScroll from './get-scroll';
import type {
  DimensionMarshal,
  DroppableCallbacks,
  RecollectDroppableOptions,
} from '../../state/dimension-marshal/dimension-marshal-types';
import getEnv, { type Env } from './get-env';
import type {
  DroppableId,
  TypeId,
  DroppableDimension,
  DroppableDescriptor,
  Direction,
  ScrollOptions,
} from '../../types';
import getDimension from './get-dimension';
import AppContext, { type AppContextValue } from '../context/app-context';
import withoutPlaceholder from './without-placeholder';
import { warning } from '../../dev-warning';
import getListenerOptions from './get-listener-options';
import useRequiredContext from '../use-required-context';
import usePreviousRef from '../use-previous-ref';

type Props = {|
  droppableId: DroppableId,
  type: TypeId,
  direction: Direction,
  isDropDisabled: boolean,
  isCombineEnabled: boolean,
  ignoreContainerClipping: boolean,
  getPlaceholderRef: () => ?HTMLElement,
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

export default function useDroppableDimensionPublisher(args: Props) {
  const whileDraggingRef = useRef<?WhileDragging>(null);
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const marshal: DimensionMarshal = appContext.marshal;
  const previousRef: { current: Props } = usePreviousRef(args);
  const descriptor: DroppableDescriptor = useMemo((): DroppableDescriptor => {
    return {
      id: args.droppableId,
      type: args.type,
    };
  }, [args.droppableId, args.type]);
  const publishedDescriptorRef = useRef<DroppableDescriptor>(descriptor);

  const memoizedUpdateScroll = useCallback(
    (x: number, y: number) => {
      invariant(
        whileDraggingRef.current,
        'Can only update scroll when dragging',
      );
      const scroll: Position = { x, y };
      marshal.updateDroppableScroll(descriptor.id, scroll);
    },
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

      if (env.closestScrollable) {
        // bind scroll listener

        env.closestScrollable.addEventListener(
          'scroll',
          onClosestScroll,
          getListenerOptions(dragging.scrollOptions),
        );
        // print a debug warning if using an unsupported nested scroll container setup
        if (process.env.NODE_ENV !== 'production') {
          checkForNestedScrollContainers(env.closestScrollable);
        }
      }

      return dimension;
    },
    [descriptor, onClosestScroll, previousRef],
  );
  const recollect = useCallback(
    (options: RecollectDroppableOptions): DroppableDimension => {
      const dragging: ?WhileDragging = whileDraggingRef.current;
      const closest: ?Element = getClosestScrollableFromDrag(dragging);
      invariant(
        dragging && closest,
        'Can only recollect Droppable client for Droppables that have a scroll container',
      );

      const previous: Props = previousRef.current;

      const execute = (): DroppableDimension =>
        getDimension({
          ref: dragging.ref,
          descriptor: dragging.descriptor,
          env: dragging.env,
          windowScroll: origin,
          direction: previous.direction,
          isDropDisabled: previous.isDropDisabled,
          isCombineEnabled: previous.isCombineEnabled,
          shouldClipSubject: !previous.ignoreContainerClipping,
        });

      if (!options.withoutPlaceholder) {
        return execute();
      }

      return withoutPlaceholder(previous.getPlaceholderRef(), execute);
    },
    [previousRef],
  );
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
    console.log('creating callbacks');
    return {
      getDimensionAndWatchScroll,
      recollect,
      dragStopped,
      scroll,
    };
  }, [dragStopped, getDimensionAndWatchScroll, recollect, scroll]);

  // Register with the marshal and let it know of:
  // - any descriptor changes
  // - when it unmounts
  useLayoutEffect(() => {
    publishedDescriptorRef.current = descriptor;
    marshal.registerDroppable(descriptor, callbacks);

    return () => {
      if (whileDraggingRef.current) {
        warning(
          'Unsupported: changing the droppableId or type of a Droppable during a drag',
        );
        dragStopped();
      }
      console.log('goodbye droppable', descriptor);

      marshal.unregisterDroppable(descriptor);
    };
  }, [callbacks, descriptor, dragStopped, marshal]);

  // update is enabled with the marshal
  useLayoutEffect(() => {
    marshal.updateDroppableIsEnabled(
      publishedDescriptorRef.current.id,
      !args.isDropDisabled,
    );
  }, [args.isDropDisabled, marshal]);

  // update is combine enabled with the marshal
  useLayoutEffect(() => {
    marshal.updateDroppableIsCombineEnabled(
      publishedDescriptorRef.current.id,
      args.isCombineEnabled,
    );
  }, [args.isCombineEnabled, marshal]);
}
