// @flow
import { useCallbackOne } from 'use-memo-one';
import type { Props } from './droppable-types';
import type { Responders } from '../../types';
import type { DroppableResponderRegistration } from '../use-droppable-responders/droppable-responders-types';
import usePrevious from '../use-previous-ref';
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';

export default function useResponders(props: Props) {
  const { droppableId } = props;
  const previousRef = usePrevious<Props>(props);
  const context: AppContextValue = useRequiredContext(AppContext);
  const registration: DroppableResponderRegistration =
    context.droppableResponderRegistration;

  const getResponders = useCallbackOne(
    (): Responders => ({
      onBeforeDragStart: previousRef.onBeforeDragStart,
      onDragStart: previousRef.onDragStart,
      onDragUpdate: previousRef.onDragUpdate,
      onDragEnd: previousRef.onDragEnd,
    }),
    [],
  );

  useIsomorphicLayoutEffect(() => {
    registration.register(droppableId, getResponders);
    return () => registration.unregister(droppableId);
  }, [droppableId, getResponders, registration]);
}
