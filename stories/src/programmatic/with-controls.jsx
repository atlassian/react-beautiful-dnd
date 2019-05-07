// @flow
import React, {
  useRef,
  createRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import styled from '@emotion/styled';
import type { Quote } from '../types';
import type { DropResult } from '../../../src/types';
import type { MovementCallbacks } from '../../../src/view/use-sensor-marshal/sensor-types';
import { DragDropContext } from '../../../src';
import QuoteList from '../primatives/quote-list';
import reorder from '../reorder';
import { grid } from '../constants';

type ControlProps = {|
  quotes: Quote[],
  canLift: boolean,
  isDragging: boolean,
  lift: (quoteId: string) => ?MovementCallbacks,
|};

function noop() {}

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
    <div>
      <select disabled={!canLift} ref={selectRef}>
        {quotes.map((quote: Quote) => (
          <option key={quote.id} value={quote.id}>
            id: {quote.id}
          </option>
        ))}
      </select>
      <button
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
        Lift
      </button>
      <button
        type="button"
        onClick={() =>
          maybe((callbacks: MovementCallbacks) => callbacks.moveUp())
        }
        disabled={!isDragging}
      >
        Up
      </button>
      <button
        type="button"
        onClick={() =>
          maybe((callbacks: MovementCallbacks) => callbacks.moveDown())
        }
        disabled={!isDragging}
      >
        Down
      </button>
      <button
        type="button"
        onClick={() =>
          maybe((callbacks: MovementCallbacks) => {
            callbacksRef.current = null;
            callbacks.drop();
          })
        }
        disabled={!isDragging}
      >
        Drop
      </button>
    </div>
  );
}

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
      <QuoteList listId="list" quotes={quotes} />
      <Controls
        quotes={quotes}
        canLift={!isDragging}
        isDragging={isControlDragging}
        lift={lift}
      />
    </DragDropContext>
  );
}
