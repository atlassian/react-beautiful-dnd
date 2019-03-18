// @flow
import { useMemo, useCallback, useLayoutEffect } from 'react';
import {
  calculateBox,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
  DraggableDescriptor,
  DraggableDimension,
  Placeholder,
  DraggableId,
  DroppableId,
  TypeId,
} from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';
import { origin } from '../../state/position';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';

export type Args = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  type: TypeId,
  index: number,
  getDraggableRef: () => ?HTMLElement,
|};

function getDimension(
  descriptor: DraggableDescriptor,
  el: HTMLElement,
  windowScroll?: Position = origin,
): DraggableDimension {
  const computedStyles: CSSStyleDeclaration = window.getComputedStyle(el);
  const borderBox: ClientRect = el.getBoundingClientRect();
  const client: BoxModel = calculateBox(borderBox, computedStyles);
  const page: BoxModel = withScroll(client, windowScroll);

  const placeholder: Placeholder = {
    client,
    tagName: el.tagName.toLowerCase(),
    display: computedStyles.display,
  };
  const displaceBy: Position = {
    x: client.marginBox.width,
    y: client.marginBox.height,
  };

  const dimension: DraggableDimension = {
    descriptor,
    placeholder,
    displaceBy,
    client,
    page,
  };

  return dimension;
}

export default function useDraggableDimensionPublisher(args: Args) {
  const { draggableId, droppableId, type, index, getDraggableRef } = args;
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const marshal: DimensionMarshal = appContext.marshal;

  const descriptor: DraggableDescriptor = useMemo(
    () => ({
      id: draggableId,
      droppableId,
      type,
      index,
    }),
    [draggableId, droppableId, index, type],
  );

  const makeDimension = useCallback(
    (windowScroll?: Position): DraggableDimension => {
      const el: ?HTMLElement = getDraggableRef();
      invariant(el, 'Cannot get dimension when no ref is set');
      return getDimension(descriptor, el, windowScroll);
    },
    [descriptor, getDraggableRef],
  );

  useLayoutEffect(() => {
    marshal.registerDraggable(descriptor, makeDimension);
    return () => marshal.unregisterDraggable(descriptor);
  }, [descriptor, makeDimension, marshal]);
}
