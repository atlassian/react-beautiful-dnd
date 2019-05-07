// @flow
/* eslint-disable no-console */
import React, { useRef, createRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';
import type { Quote } from '../types';
import type { DropResult } from '../../../src/types';
import type { MovementCallbacks } from '../../../src/view/use-sensor-marshal/sensor-types';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import reorder from '../reorder';
import { grid, borderRadius } from '../constants';

type ControlProps = {|
  quotes: Quote[],
  canLift: boolean,
  isDragging: boolean,
  lift: (quoteId: string) => ?MovementCallbacks,
|};

function noop() {}

const ControlBox = styled.div`
  display: flex;
  flex-direction: column;
`;

const ArrowBox = styled.div`
  margin-top: ${grid * 4}px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Button = styled.button`
  --off-white: hsla(60, 100%, 98%, 1);
  --dark-off-white: #efefe3;
  --darker-off-white: #d6d6cb;
  --border-width: 4px;

  background: var(--off-white);
  border-radius: ${borderRadius}px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  font-size: 16px;
  position: relative;
  box-sizing: border-box;
  border: var(--border-width) solid var(--dark-off-white);
  box-shadow: 0 0 0 1px var(--darker-off-white);
  margin: 2px;

  ::before {
    position: absolute;
    content: ' ';
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border: 1px solid var(--dark-off-white);
  }

  :active {
    border-width: 3px;
  }
`;

const ArrowButton = styled(Button)`
  width: 40px;
  height: 40px;
`;

// locking the height so that the border width change
// does not change the size of the button
const ActionButton = styled(Button)`
  height: 40px;
`;

function Controls(props: ControlProps) {
  const { quotes, canLift, isDragging, lift } = props;
  const callbacksRef = useRef<?MovementCallbacks>(null);

  const selectRef = createRef();

  function maybe(fn: (callbacks: MovementCallbacks) => void) {
    if (callbacksRef.current) {
      fn(callbacksRef.current);
    }
  }

  return (
    <ControlBox>
      <select disabled={!canLift} ref={selectRef}>
        {quotes.map((quote: Quote) => (
          <option key={quote.id} value={quote.id}>
            id: {quote.id}
          </option>
        ))}
      </select>
      <ActionButton
        type="button"
        disabled={!canLift}
        onClick={() => {
          const select: ?HTMLSelectElement = selectRef.current;
          if (!select) {
            return;
          }

          callbacksRef.current = lift(select.value);
        }}
      >
        Lift 🏋️‍♀️
      </ActionButton>
      <ActionButton
        type="button"
        onClick={() =>
          maybe((callbacks: MovementCallbacks) => {
            callbacksRef.current = null;
            callbacks.drop();
          })
        }
        disabled={!isDragging}
      >
        Drop 🤾‍♂️
      </ActionButton>
      <ArrowBox>
        <ArrowButton
          type="button"
          onClick={() =>
            maybe((callbacks: MovementCallbacks) => callbacks.moveUp())
          }
          disabled={!isDragging}
          label="up"
        >
          ↑
        </ArrowButton>
        <div>
          <ArrowButton type="button" disabled={!isDragging} label="left">
            ←
          </ArrowButton>
          <ArrowButton
            type="button"
            onClick={() =>
              maybe((callbacks: MovementCallbacks) => callbacks.moveDown())
            }
            disabled={!isDragging}
            label="down"
          >
            ↓
          </ArrowButton>
          <ArrowButton type="button" disabled={!isDragging} label="right">
            →
          </ArrowButton>
        </div>
      </ArrowBox>
    </ControlBox>
  );
}

const Layout = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${grid * 4}px;

  > * {
    margin: ${grid}px;
  }
`;

type Props = {|
  initial: Quote[],
|};

export default function QuoteApp(props: Props) {
  const [quotes, setQuotes] = useState(props.initial);
  const [isDragging, setIsDragging] = useState(false);
  const [isControlDragging, setIsControlDragging] = useState(false);
  const tryStartCapturingRef = useRef<
    (el: Element, abort: () => void) => ?MovementCallbacks,
  >(() => null);

  const onDragEnd = useCallback(
    function onDragEnd(result: DropResult) {
      setIsDragging(false);
      setIsControlDragging(false);
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

  function lift(quoteId: string): ?MovementCallbacks {
    if (isDragging) {
      return null;
    }
    const selector: string = `[data-rbd-draggable-id="${quoteId}"][data-rbd-drag-handle-context-id]`;
    const handle: ?HTMLElement = document.querySelector(selector);
    if (!handle) {
      console.log('could not find drag handle');
      return null;
    }

    const callbacks: ?MovementCallbacks = tryStartCapturingRef.current(
      handle,
      noop,
    );

    if (!callbacks) {
      console.log('unable to start capturing');
      return null;
    }
    console.log('capture started');
    callbacks.lift({ mode: 'SNAP' });
    setIsControlDragging(true);

    return callbacks;
  }

  return (
    <DragDropContext
      onDragStart={() => setIsDragging(true)}
      onDragEnd={onDragEnd}
      __unstableSensors={[
        tryCapture => {
          tryStartCapturingRef.current = tryCapture;
        },
      ]}
    >
      <Layout>
        <QuoteList listId="list" quotes={quotes} />
        <Controls
          quotes={quotes}
          canLift={!isDragging}
          isDragging={isControlDragging}
          lift={lift}
        />
      </Layout>
    </DragDropContext>
  );
}
