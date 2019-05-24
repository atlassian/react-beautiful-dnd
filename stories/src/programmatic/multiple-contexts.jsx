// @flow
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useCallback } from 'use-memo-one';
import type { Quote } from '../types';
import type {
  DropResult,
  PreDragActions,
  DragActions,
  Sensor,
} from '../../../src/types';
import { quotes as initial } from '../data';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import reorder from '../reorder';

function sleep(fn: Function, time?: number = 300) {
  return new Promise(resolve => {
    setTimeout(() => {
      fn();
      resolve();
    }, time);
  });
}

function getSensor(contextId: string, delay: number) {
  return function useCustomSensor(
    tryGetActionLock: (
      source: Event | Element,
      abort: () => void,
    ) => ?PreDragActions,
  ) {
    const start = useCallback(
      async function start() {
        // grabbing the first drag handle we can
        const handle: ?HTMLElement = document.querySelector(
          `[data-rbd-drag-handle-context-id="${contextId}"]`,
        );
        if (!handle) {
          console.log('could not find drag handle');
          return;
        }

        const preDrag: ?PreDragActions = tryGetActionLock(handle, () => {});

        if (!preDrag) {
          console.warn('unable to start drag');
          return;
        }
        console.warn('starting drag');

        const actions: DragActions = preDrag.lift({
          mode: 'SNAP',
        });
        const { moveDown, moveUp, drop } = actions;

        for (let i = 0; i < 100; i++) {
          await sleep(moveDown, delay);
          await sleep(moveDown, delay);
          await sleep(moveUp, delay);
          await sleep(moveUp, delay);
        }

        await sleep(drop, delay);
      },
      [tryGetActionLock],
    );

    useEffect(() => {
      start();
    }, [start]);
  };
}

type Props = {|
  initial: Quote[],
  sensors?: Sensor[],
|};

function QuoteApp(props: Props) {
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
    <DragDropContext onDragEnd={onDragEnd} __unstableSensors={props.sensors}>
      <QuoteList listId="list" quotes={quotes} />
    </DragDropContext>
  );
}

const Root = styled.div`
  display: flex;
  justify-content: space-evenly;
`;

export default function App() {
  // This is a pretty basic setup that will not work with hot reloading
  // would need to manually pull the context id from a data attribute to make it more resiliant
  return (
    <Root>
      <QuoteApp initial={initial} sensors={[getSensor('0', 300)]} />
      <QuoteApp initial={initial} sensors={[getSensor('1', 400)]} />
      <QuoteApp initial={initial} />
    </Root>
  );
}
