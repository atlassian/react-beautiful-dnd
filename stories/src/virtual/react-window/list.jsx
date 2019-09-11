// @flow
import React, { useState } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import type { Quote } from '../../types';
import {
  Droppable,
  Draggable,
  DragDropContext,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DraggableDescriptor,
  type DropResult,
} from '../../../../src';
import QuoteItem from '../../primatives/quote-item';
import reorder from '../../reorder';

type Props = {|
  initial: Quote[],
|};

type RowProps = {
  data: Quote[],
  index: number,
  style: Object,
};

const Row = React.memo(({ data: quotes, index, style }: RowProps) => {
  const quote: Quote = quotes[index];

  return (
    <Draggable draggableId={quote.id} index={index} key={quote.id}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <QuoteItem
          provided={provided}
          quote={quote}
          isDragging={snapshot.isDragging}
          style={{ margin: 0, ...style }}
        />
      )}
    </Draggable>
  );
}, areEqual);

function App(props: Props) {
  const [quotes, setQuotes] = useState(() => props.initial);

  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }
    if (result.source.index === result.destination.index) {
      return;
    }

    const newQuotes: Quote[] = reorder(
      quotes,
      result.source.index,
      result.destination.index,
    );
    setQuotes(newQuotes);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable
        droppableId="droppable"
        mode="VIRTUAL"
        renderClone={(
          provided: DraggableProvided,
          snapshot: DraggableStateSnapshot,
          descriptor: DraggableDescriptor,
        ) => (
          <QuoteItem
            provided={provided}
            isDragging={snapshot.isDragging}
            quote={quotes[descriptor.index]}
            style={{ margin: 0 }}
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
