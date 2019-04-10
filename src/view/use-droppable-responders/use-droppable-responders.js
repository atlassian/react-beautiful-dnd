// @flow
import { useRef } from 'react';
import { useCallbackOne, useMemoOne } from 'use-memo-one';
import invariant from 'tiny-invariant';
import type { Responders, DroppableId } from '../../types';
import type { DroppableResponderRegistration } from './droppable-responders-types';

type GetResponders = () => Responders;

type DroppableResponderCache = {
  [id: DroppableId]: GetResponders,
};

export type Result = {|
  registration: DroppableResponderRegistration,
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

  const registration: DroppableResponderRegistration = useMemoOne(
    () => ({
      register,
      unregister,
    }),
    [register, unregister],
  );

  const getDroppableResponders = useCallbackOne((id: DroppableId) => {
    const getResponders: ?GetResponders = cacheRef.current[id];

    invariant(getResponders, `Could not find droppable reponder for id: ${id}`);

    return getResponders();
  }, []);

  const result: Result = useMemoOne(
    () => ({
      registration,
      getDroppableResponders,
    }),
    [registration, getDroppableResponders],
  );

  return result;
}
