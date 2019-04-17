// @flow
import { useRef } from 'react';
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import { useMemo, useCallback } from 'use-memo-one';
import type {
  DraggableDescriptor,
  DraggableDimension,
  DraggableId,
} from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import getDimension from './get-dimension';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';

export type Args = {|
  draggableId: DraggableId,
  index: number,
  getDraggableRef: () => ?HTMLElement,
|};

export default function useDraggableDimensionPublisher(args: Args) {
  const { draggableId, index, getDraggableRef } = args;
  // App context
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const marshal: DimensionMarshal = appContext.marshal;

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

  const publishedDescriptorRef = useRef<DraggableDescriptor>(descriptor);

  const makeDimension = useCallback(
    (windowScroll?: Position): DraggableDimension => {
      const latest: DraggableDescriptor = publishedDescriptorRef.current;
      const el: ?HTMLElement = getDraggableRef();
      invariant(el, 'Cannot get dimension when no ref is set');
      return getDimension(latest, el, windowScroll);
    },
    [getDraggableRef],
  );

  // handle mounting / unmounting
  useIsomorphicLayoutEffect(() => {
    marshal.registerDraggable(publishedDescriptorRef.current, makeDimension);
    return () => marshal.unregisterDraggable(publishedDescriptorRef.current);
  }, [makeDimension, marshal]);

  // handle updates to descriptor
  useIsomorphicLayoutEffect(() => {
    // this will happen when mounting
    if (publishedDescriptorRef.current === descriptor) {
      return;
    }

    const previous: DraggableDescriptor = publishedDescriptorRef.current;
    publishedDescriptorRef.current = descriptor;

    marshal.updateDraggable(previous, descriptor, makeDimension);
  }, [descriptor, makeDimension, marshal]);
}
