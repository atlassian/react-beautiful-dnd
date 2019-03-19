// @flow
import { useMemo, useCallback, useLayoutEffect } from 'react';
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
  DraggableDescriptor,
  DraggableDimension,
  DraggableId,
  DroppableId,
  TypeId,
} from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import getDimension from './get-dimension';

export type Args = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  type: TypeId,
  index: number,
  getDraggableRef: () => ?HTMLElement,
|};

export default function useDraggableDimensionPublisher(args: Args) {
  const { draggableId, droppableId, type, index, getDraggableRef } = args;
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const marshal: DimensionMarshal = appContext.marshal;

  const descriptor: DraggableDescriptor = useMemo(() => {
    const result = {
      id: draggableId,
      droppableId,
      type,
      index,
    };
    console.log('creating new descriptor', result);
    return result;
  }, [draggableId, droppableId, index, type]);

  const makeDimension = useCallback(
    (windowScroll?: Position): DraggableDimension => {
      const el: ?HTMLElement = getDraggableRef();
      invariant(el, 'Cannot get dimension when no ref is set');
      return getDimension(descriptor, el, windowScroll);
    },
    [descriptor, getDraggableRef],
  );

  // Communicate with the marshal
  // TODO: should it be an "update"?
  useLayoutEffect(() => {
    marshal.registerDraggable(descriptor, makeDimension);
    return () => marshal.unregisterDraggable(descriptor);
  }, [descriptor, makeDimension, marshal]);
}
