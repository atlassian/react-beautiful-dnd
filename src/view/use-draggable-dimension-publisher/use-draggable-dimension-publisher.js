// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import { useMemo, useCallback } from 'use-memo-one';
import type {
  DraggableDescriptor,
  DraggableDimension,
  DraggableId,
  Id,
  DraggableOptions,
} from '../../types';
import type {
  Registry,
  DraggableEntry,
} from '../../state/registry/registry-types';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import makeDimension from './get-dimension';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';
import useLayoutEffect from '../use-isomorphic-layout-effect';
import useUniqueId from '../use-unique-id';

export type Args = {|
  draggableId: DraggableId,
  index: number,
  getDraggableRef: () => ?HTMLElement,
  ...DraggableOptions,
|};

export default function useDraggableDimensionPublisher(args: Args) {
  const uniqueId: Id = useUniqueId('draggable');

  const {
    draggableId,
    index,
    getDraggableRef,
    canDragInteractiveElements,
    shouldRespectForcePress,
    isEnabled,
  } = args;

  // App context
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const registry: Registry = appContext.registry;

  // Droppable context
  const droppableContext: DroppableContextValue = useRequiredContext(
    DroppableContext,
  );
  const { droppableId, type } = droppableContext;

  const descriptor: DraggableDescriptor = useMemo(() => {
    const result = {
      id: draggableId,
      droppableId,
      type,
      index,
    };
    return result;
  }, [draggableId, droppableId, index, type]);

  const options: DraggableOptions = useMemo(
    () => ({
      canDragInteractiveElements,
      shouldRespectForcePress,
      isEnabled,
    }),
    [canDragInteractiveElements, isEnabled, shouldRespectForcePress],
  );

  const getDimension = useCallback(
    (windowScroll?: Position): DraggableDimension => {
      const el: ?HTMLElement = getDraggableRef();
      invariant(el, 'Cannot get dimension when no ref is set');
      return makeDimension(descriptor, el, windowScroll);
    },
    [descriptor, getDraggableRef],
  );

  const published: DraggableEntry = useMemo(
    () => ({
      uniqueId,
      descriptor,
      options,
      getDimension,
    }),
    [descriptor, getDimension, options, uniqueId],
  );

  useLayoutEffect(() => {
    registry.draggable.register(published);
    return () => registry.draggable.unregister(published);
  }, [published, registry.draggable]);
}
