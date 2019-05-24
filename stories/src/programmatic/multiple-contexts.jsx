/* eslint-disable no-await-in-loop */
// @flow
import React, { useState, useEffect, createRef } from 'react';
import invariant from 'tiny-invariant';
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
import * as dataAttr from '../../../src/view/data-attributes';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import reorder from '../reorder';
import bindEvents from '../../../src/view/event-bindings/bind-events';

function sleep(fn: Function, time?: number = 300) {
  return new Promise(resolve => {
    setTimeout(() => {
      fn();
      resolve();
    }, time);
  });
}

function getSensor(getContextId: () => string, delay: number) {
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
          `[data-rbd-drag-handle-context-id="${getContextId()}"]`,
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
        const { moveDown, moveUp, drop, isActive, cancel } = actions;

        const unbind = bindEvents(window, [
          {
            eventName: 'resize',
            fn: cancel,
            options: { once: true },
          },
        ]);

        for (let i = 0; i < 20 && isActive(); i++) {
          await sleep(() => {
            // might no longer be active after delay
            if (!isActive()) {
              return;
            }
            if (i % 2 === 0) {
              moveDown();
            } else {
              moveUp();
            }
          }, delay);
        }

        if (isActive()) {
          await sleep(drop, delay);
        }

        unbind();
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

const Column = styled.div``;

const Title = styled.h3`
  text-align: center;
`;

const selector: string = `[${dataAttr.droppable.contextId}]`;

function getContextIdFromEl(el: ?HTMLElement) {
  invariant(el, 'No ref set');
  const droppable: ?HTMLElement = el.querySelector(selector);
  invariant(droppable, 'Could not find droppable');
  const contextId: ?string = droppable.getAttribute(
    dataAttr.droppable.contextId,
  );
  invariant(contextId, 'Expected data attribute to be set');
  return contextId;
}

export default function App() {
  const firstRef = createRef();
  const secondRef = createRef();

  function getContextId(ref) {
    return () => getContextIdFromEl(ref.current);
  }

  return (
    <Root>
      <Column ref={firstRef}>
        <Title>Programmatic #1</Title>
        <QuoteApp
          initial={initial}
          sensors={[getSensor(getContextId(firstRef), 300)]}
        />
      </Column>
      <Column ref={secondRef}>
        <Title>Programmatic #2</Title>
        <QuoteApp
          initial={initial}
          sensors={[getSensor(getContextId(secondRef), 400)]}
        />
      </Column>
      <Column>
        <Title>User controlled</Title>
        <QuoteApp initial={initial} />
      </Column>
    </Root>
  );
}
