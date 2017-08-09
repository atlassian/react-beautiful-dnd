// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import QuoteApp from './components/quote-app';
import { grid } from './components/constants';
import { getQuotes } from './components/quotes';
import type { Quote } from './components/types';

const bigData: Quote[] = getQuotes(40);

const ScrollContainer = styled.div`
  box-sizing: border-box;
  background: lightgrey;
  padding: ${grid * 2}px;
  overflow-y: scroll;
  width: 500px;

  height: 100vh;
  position: relative;
`;

const ScrollContainerTitle = styled.h4`
  text-align: center;
  margin-bottom: ${grid}px;
`;

storiesOf('window scroll and scroll containers', module)
  .add('window scrolling', () => (
    <QuoteApp
      initial={bigData}
    />
  ))
  .add('droppable is a scroll container', () => (
    <QuoteApp
      initial={bigData}
      listStyle={{
        overflowY: 'scroll',
        maxHeight: '80vh',
        position: 'relative',
      }}
    />
  ))
  .add('window scrolling and a droppable scroll container', () => (
    <QuoteApp
      initial={bigData}
      listStyle={{
        overflowY: 'scroll',
        maxHeight: '120vh',
        position: 'relative',
      }}
    />
  ))
  .add('droppable within a larger scroll container', () => (
    <ScrollContainer>
      <ScrollContainerTitle>List is within a larger scroll container</ScrollContainerTitle>
      <QuoteApp
        initial={bigData}
      />
    </ScrollContainer>
  ));

