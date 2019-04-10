// @flow
import { useCallbackOne } from 'use-memo-one';
import type { Props } from './droppable-types';
import type { Responders } from '../../types';
import usePrevious from '../use-previous-ref';
import useIsomorphicLayoutEffect from '../use-isomorphic-layout-effect';
import useRequiredContext from '../use-required-context';
import DroppableRespondersContext, {
  type DroppableRespondersContextValue,
} from '../context/droppable-responders-context';

export default function useResponders(props: Props) {
  const { droppableId } = props;
  const previousRef = usePrevious<Props>(props);
  const {
    register,
    unregister,
  }: DroppableRespondersContextValue = useRequiredContext(
    DroppableRespondersContext,
  );

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
    register(droppableId, getResponders);
    return () => unregister(droppableId);
  }, [droppableId, getResponders]);
}
