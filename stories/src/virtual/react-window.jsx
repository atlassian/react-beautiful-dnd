// @flow
import React, { useState, useEffect } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import type { Quote } from '../types';
import {
  Droppable,
  Draggable,
  DragDropContext,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DraggableLocation,
} from '../../../src';
import QuoteItem from '../primatives/quote-item';

type Props = {|
  initial: Quote[],
|};

type ItemProps = {|
  provided: DraggableProvided,
  quote: Quote,
  style?: Object,
|};

function Item(props: ItemProps) {
  const { quote, provided, style } = props;

  useEffect(() => {
    console.log('quote mounted', quote.id);
    return () => console.log('quote unmounted', quote.id);
  }, [quote.id]);
  return (
    <div
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      style={{
        ...provided.draggableProps.style,
        ...style,
      }}
    >
      {quote.id}
    </div>
  );
}

const Row = React.memo(({ data: quotes, index, style }) => {
  const quote: Quote = quotes[index];

  return (
    <Draggable draggableId={quote.id} index={index} key={quote.id}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <QuoteItem
          provided={provided}
          quote={quote}
          style={style}
          isDragging={snapshot.isDragging}
        />
      )}
    </Draggable>
  );
}, areEqual);

function App(props: Props) {
  const quotes: Quote[] = useState(() => props.initial)[0];

  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable
        droppableId="droppable"
        whenDraggingClone={(
          provided: DraggableProvided,
          snapshot: DraggableStateSnapshot,
          source: DraggableLocation,
        ) => (
          <QuoteItem
            provided={provided}
            isDragging={snapshot.isDragging}
            quote={quotes[source.index]}
          />
        )}
      >
        {(droppableProvided: DroppableProvided) => (
          <List
            height={500}
            itemCount={quotes.length}
            itemSize={100}
            width={300}
            innerRef={droppableProvided.innerRef}
            itemData={quotes}
          >
            {Row}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default App;
