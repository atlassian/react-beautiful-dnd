// @flow
import React from 'react';
import type { PublicOwnProps, PrivateOwnProps } from './draggable-types';
import ConnectedDraggable from './connected-draggable';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import DroppableContext, {
  type DroppableContextValue,
} from '../context/droppable-context';

export function PrivateDraggable(props: PrivateOwnProps) {
  // Adding context to props so it can be used in selector
  const appContext: AppContextValue = useRequiredContext(AppContext);
  const droppableContext: DroppableContextValue = useRequiredContext(
    DroppableContext,
  );

  return (
    <ConnectedDraggable
      appContext={appContext}
      droppableContext={droppableContext}
      {...props}
    />
  );
}

export function PublicDraggable(props: PublicOwnProps) {
  return <PrivateDraggable {...props} isClone={false} />;
}
