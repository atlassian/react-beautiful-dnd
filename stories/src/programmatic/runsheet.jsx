// @flow
/* eslint-disable no-console */
import React, { useState, useCallback, useEffect } from 'react';
import type { Quote } from '../types';
import type {
  DropResult,
  PreDragActions,
  SnapDragActions,
} from '../../../src/types';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import reorder from '../reorder';

function delay(fn: Function, time?: number = 300) {
  return new Promise(resolve => {
    setTimeout(() => {
      fn();
      resolve();
    }, time);
  });
}

function noop() {}

function useDemoSensor(
  tryGetActionLock: (
    source: Event | Element,
    abort: () => void,
  ) => ?PreDragActions,
) {
  const start = useCallback(
    async function start() {
      // grabbing the first drag handle we can
      const handle: ?HTMLElement = document.querySelector(
        '[data-rbd-drag-handle-context-id]',
      );
      if (!handle) {
        console.log('could not find drag handle');
        return;
      }

      // handle.scrollIntoView();

      const preDrag: ?PreDragActions = tryGetActionLock(handle, noop);

      if (!preDrag) {
        console.warn('unable to start drag');
        return;
      }
      console.warn('starting drag');

      const actions: SnapDragActions = preDrag.snapLift();
      const { moveDown, moveUp, drop } = actions;

      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveDown);
      await delay(moveUp);
      await delay(moveUp);
      await delay(drop);
    },
    [tryGetActionLock],
  );

  useEffect(() => {
    start();
  }, [start]);
}

type Props = {|
  initial: Quote[],
|};

export default function QuoteApp(props: Props) {
  const [quotes, setQuotes] = useState(props.initial);

  const onDragEnd = useCallback(
    function onDragEnd(result: DropResult) {
      // dropped outside the list
      if (!result.destination) {
        return;
      }

      if (result.destination.index === result.source.index) {
        return;
      }

      const newQuotes = reorder(
        quotes,
        result.source.index,
        result.destination.index,
      );

      setQuotes(newQuotes);
    },
    [quotes],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd} __unstableSensors={[useDemoSensor]}>
      <QuoteList listId="list" quotes={quotes} />
    </DragDropContext>
  );
}
