// @flow
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { getQuotes } from '../data';
import QuoteList from '../primatives/quote-list';
import { DragDropContext } from '../../../src';
import { noop } from '../../../src/empty';

const Parent = styled.div`
  display: flex;
`;

export default function App() {
  const [first] = useState(() => getQuotes(3));
  const [second] = useState(() => getQuotes(3));
  return (
    <DragDropContext onDragEnd={noop}>
      <p>This is a bit lame right now</p>
      <Parent>
        <QuoteList listId="first" quotes={first} />
        <QuoteList listId="second" quotes={second} style={{ width: 800 }} />
      </Parent>
    </DragDropContext>
  );
}
