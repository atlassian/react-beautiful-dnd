// @flow
import React from 'react';
import styled from 'styled-components';
import QuoteApp from '../../components/examples/vertical/quote-app';
import { quotes, getQuotes } from '../../components/examples/data';
import { grid } from '../../components/examples/constants';

const data = {
  small: quotes,
  // small: getQuotes(3),
  medium: getQuotes(40),
  large: getQuotes(500),
};

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

export default () => (
  <div>
    <div>basic</div>
    <QuoteApp initial={data.small} />
    <div>large data set</div>
    <QuoteApp
      initial={data.large}
    />
    <div>Droppable is a scroll container</div>
    <QuoteApp
      initial={data.medium}
      listStyle={{
        overflowY: 'scroll',
        maxHeight: '80vh',
        position: 'relative',
      }}
    />
    <div>window scrolling and a Droppable scroll container</div>
    <QuoteApp
      initial={data.medium}
      listStyle={{
        overflowY: 'scroll',
        maxHeight: '120vh',
        position: 'relative',
      }}
    />
    <div>within a larger scroll container</div>
    <ScrollContainer>
      <Title>List is within a larger scroll container</Title>
      <QuoteApp
        initial={data.medium}
      />
    </ScrollContainer>
  </div>
);
