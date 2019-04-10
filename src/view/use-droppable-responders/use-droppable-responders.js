// @flow
import { useRef } from 'react';
import { useCallbackOne, useMemoOne } from 'use-memo-one';
import invariant from 'tiny-invariant';
import type { Responders, DroppableId } from '../../types';

type GetResponders = () => Responders;

type DroppableResponderCache = {
  [id: DroppableId]: GetResponders,
};

export type Result = {|
  register: (id: DroppableId, getResponders: GetResponders) => void,
  unregister: (id: DroppableId) => void,
  getDroppableResponders: (id: DroppableId) => Responders,
|};

export default function useDroppableResponders() {
  const cacheRef = useRef<DroppableResponderCache>({});

  const register = useCallbackOne(
    (id: DroppableId, getResponders: GetResponders) => {
      cacheRef.current[id] = getResponders;
    },
    [],
  );

  const unregister = useCallbackOne((id: DroppableId) => {
    delete cacheRef.current[id];
  }, []);

  const getDroppableResponders = useCallbackOne((id: DroppableId) => {
    const getResponders: ?GetResponders = cacheRef.current[id];

    invariant(getResponders, `Could not find droppable reponder for id: ${id}`);

    return getResponders();
  }, []);

  const result: Result = useMemoOne(
    () => ({
      register,
      unregister,
      getDroppableResponders,
    }),
    [],
  );

  return result;
}
