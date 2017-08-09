import React, { Component } from 'react';
import styled from 'styled-components';
import TrackerEntry from './tracker-entry';
import { grid } from './constants';
import type { DropResult } from '../../src/types';

const Container = styled.div`
  height: 300px;
  overflow-y: auto;
`;

const Title = styled.h4`
  margin-bottom: ${grid}px;
`;

export default class QuoteTracker extends Component {
  props: {|
    current: ?DropResult,
    history: DropResult[],
  |}

  render() {
    const { current, history } = this.props;
    return (
      <Container>
        <Title>Dragging</Title>
        {current ? <TrackerEntry result={current} /> : (
          <div>
            <small>(Nothing is currently dragging)</small>
          </div>
        )}
        <Title>History</Title>
        {history.slice(0).reverse().map((result: DropResult, index: number) => (
          <TrackerEntry
            key={index}
            index={history.length - index}
            result={result}
          />
        ))}
        {!history.length ? (
          <div>
            <small>(No drag history)</small>
          </div>
        ) : null}
      </Container>
    );
  }
}
