// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import QuoteApp from './src/vertical/quote-app';
import { quotes, getQuotes } from './src/data';
import { grid } from './src/constants';
import type { Quote } from './src/types';

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

const Title = styled.h4`
  text-align: center;
  margin-bottom: ${grid}px;
`;

storiesOf('single vertical list', module)
  .add('simple example', () => (
    <QuoteApp initial={getQuotes(20)} />
  ))
  .add('with window scrolling', () => (
    <QuoteApp
      initial={bigData}
    />
  ))
  .add('Droppable is a scroll container', () => (
    <QuoteApp
      initial={bigData}
      listStyle={{
        overflowY: 'scroll',
        maxHeight: '80vh',
        position: 'relative',
      }}
    />
  ))
  .add('window scrolling and a Droppable scroll container', () => (
    <QuoteApp
      initial={bigData}
      listStyle={{
        overflowY: 'scroll',
        maxHeight: '120vh',
        position: 'relative',
      }}
    />
  ))
  .add('within a larger scroll container', () => (
    <ScrollContainer>
      <Title>List is within a larger scroll container</Title>
      <QuoteApp
        initial={bigData}
      />
    </ScrollContainer>
  ));
