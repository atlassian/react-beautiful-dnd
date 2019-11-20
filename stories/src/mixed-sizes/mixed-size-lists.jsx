// @flow
import React, { useState, useEffect, useRef, useContext } from 'react';
import { getBox, type Position, type BoxModel } from 'css-box-model';
import styled from '@emotion/styled';
import { colors } from '@atlaskit/theme';
import { getQuotes } from '../data';
import { type Quote } from '../types';
import {
  DragDropContext,
  type BeforeCapture,
  type DropResult,
  Droppable,
  Draggable,
} from '../../../src';
import bindEvents from '../../../src/view/event-bindings/bind-events';
import { grid } from '../constants';
import reorder, { moveBetween } from '../reorder';

const UseTrimmingContext = React.createContext<boolean>(false);

const Parent = styled.div`
  display: flex;
`;

type ItemWidth = 'small' | 'large';
const itemWidths = {
  small: 250,
  large: 600,
};

type ItemProps = {|
  quote: Quote,
  index: number,
  width: ItemWidth,
|};

const StyledItem = styled.div`
  border: 1px solid ${colors.N100};
  background: ${colors.G50};
  padding: ${grid}px;
  margin-bottom: ${grid}px;
  width: ${props =>
    props.width === 'small' ? itemWidths.small : itemWidths.large}px;
  user-select: none;
`;

function Item(props: ItemProps) {
  const { quote, index } = props;
  const ref = useRef<?HTMLElement>(null);
  const useTrimming: boolean = useContext(UseTrimmingContext);

  useEffect(() => {
    const unsubscribe = bindEvents(window, [
      {
        eventName: 'onBeforeCapture',
        fn: (event: CustomEvent) => {
          if (!useTrimming) {
            return;
          }
          if (props.width === 'small') {
            return;
          }

          const before: BeforeCapture = event.detail.before;
          const clientSelection: Position = event.detail.clientSelection;

          if (before.mode !== 'FLUID') {
            return;
          }

          if (before.draggableId !== quote.id) {
            return;
          }

          const el: ?HTMLElement = ref.current;

          if (!el) {
            return;
          }

          const box: BoxModel = getBox(el);

          // want to shrink the item to 200px wide.
          // want it to be centered as much as possible to the cursor
          const targetWidth: number = 250;
          const halfWidth: number = targetWidth / 2;
          const distanceToLeft: number = Math.max(
            clientSelection.x - box.borderBox.left,
            0,
          );

          el.style.width = `${targetWidth}px`;

          // Nothing left to do
          if (distanceToLeft < halfWidth) {
            return;
          }

          // what the new left will be
          const proposedLeftOffset: number = distanceToLeft - halfWidth;
          // what the raw right value would be
          const targetRight: number =
            box.borderBox.left + proposedLeftOffset + targetWidth;

          // how much we would be going past the right value
          const rightOverlap: number = Math.max(
            targetRight - box.borderBox.right,
            0,
          );

          // need to ensure that we don't pull the element past
          // it's resting right position
          const leftOffset: number = proposedLeftOffset - rightOverlap;

          el.style.position = 'relative';
          el.style.left = `${leftOffset}px`;
        },
      },
    ]);

    return unsubscribe;
  }, [props.width, quote.id, useTrimming]);

  return (
    <Draggable draggableId={quote.id} index={index}>
      {provided => (
        <StyledItem
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={(node: ?HTMLElement) => {
            provided.innerRef(node);
            ref.current = node;
          }}
          width={props.width}
        >
          {quote.content}
        </StyledItem>
      )}
    </Draggable>
  );
}

type ListProps = {|
  listId: string,
  quotes: Quote[],
  itemWidth: ItemWidth,
|};

const StyledList = styled.div`
  border: 1px solid ${colors.N100};
  margin: ${grid}px;
  padding: ${grid}px;
  box-sizing: border-box;
`;

function List(props: ListProps) {
  return (
    <Droppable droppableId={props.listId}>
      {provided => (
        <StyledList {...provided.droppableProps} ref={provided.innerRef}>
          {props.quotes.map((quote: Quote, index: number) => (
            <Item
              key={quote.id}
              quote={quote}
              index={index}
              width={props.itemWidth}
            />
          ))}
          {provided.placeholder}
        </StyledList>
      )}
    </Droppable>
  );
}

export default function App() {
  const [first, setFirst] = useState(() => getQuotes(3));
  const [second, setSecond] = useState(() => getQuotes(3));
  const [useTrimming, setUseTrimming] = useState(false);
  const clientSelectionRef = useRef<Position>({ x: 0, y: 0 });

  function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'first') {
        setFirst(reorder(first, source.index, destination.index));
        return;
      }
      setSecond(reorder(second, source.index, destination.index));
    }

    const { list1, list2 } = moveBetween({
      list1: {
        id: 'first',
        values: first,
      },
      list2: {
        id: 'second',
        values: second,
      },
      source,
      destination,
    });

    setFirst(list1.values);
    setSecond(list2.values);
  }

  useEffect(() => {
    const unsubscribe = bindEvents(window, [
      {
        eventName: 'mousemove',
        fn: (event: MouseEvent) => {
          const current: Position = {
            x: event.clientX,
            y: event.clientY,
          };
          clientSelectionRef.current = current;
        },
        options: { passive: true },
      },
    ]);
    return unsubscribe;
  });

  function onBeforeCapture(before: BeforeCapture) {
    window.dispatchEvent(
      new CustomEvent('onBeforeCapture', {
        detail: { before, clientSelection: clientSelectionRef.current },
      }),
    );
  }
  return (
    <UseTrimmingContext.Provider value={useTrimming}>
      <DragDropContext onBeforeCapture={onBeforeCapture} onDragEnd={onDragEnd}>
        <Parent>
          <List listId="first" quotes={first} itemWidth="small" />
          <List listId="second" quotes={second} itemWidth="large" />
        </Parent>
        Item trimming: <strong>{useTrimming ? 'enabled' : 'disabled'}</strong>
        <button
          type="button"
          onClick={() => setUseTrimming((value: boolean) => !value)}
        >
          {useTrimming ? 'disable' : 'enable'}
        </button>
      </DragDropContext>
    </UseTrimmingContext.Provider>
  );
}
