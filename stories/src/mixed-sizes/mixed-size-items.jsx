// @flow
import React, { useState } from 'react';
import { quotes as initial } from '../data';
import type { Quote } from '../types';
import QuoteList from '../primatives/quote-list';
import { DragDropContext, type DropResult } from '../../../src';
import reorder from '../reorder';

function getQuotes() {
  const large: Quote = {
    ...initial[0],
    content: Array.from({ length: 20 })
      .map(() => 'some really long text')
      .join(' '),
  };

  const quotes: Quote[] = [large, ...initial.slice(1)];
  return quotes;
}

export default function App() {
  const [quotes, setQuotes] = useState(() => getQuotes());
  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }
    setQuotes(reorder(quotes, result.source.index, result.destination.index));
  }
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <p>This is a bit lame right now</p>
      <QuoteList quotes={quotes} isCombineEnabled />
    </DragDropContext>
  );
}
