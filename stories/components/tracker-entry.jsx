// @flow
import React from 'react';
import styled from 'styled-components';
import { colors, grid } from './constants';
import type { DropResult } from '../../src/types';

type Props = {|
  result: DropResult,
  index: ?number,
|}

const Container = styled.div`
  display: flex;
  align-items: baseline;
`;

const HistoryIndex = styled.small`
  color: ${colors.blue};
  padding-right: ${grid}px;
  margin: 0;
  width: 1em;
`;

const Id = styled.small`
  padding-right: ${grid}px;
  margin: 0;
  width: 3em;
`;

const LocationIndexTitle = styled.small`
  color: ${colors.blue};
  margin: 0;
`;

const Arrow = styled.span`
  padding-right: ${grid}px;
`;

const LocationIndex = styled.div`
  width: 2em;
  text-align: center;
`;

export default ({ result, index }: Props) => (
  <Container>
    <HistoryIndex>{index != null ? index : '*'}</HistoryIndex>
    <Id>(id: {result.draggableId})</Id>
    <LocationIndexTitle>index</LocationIndexTitle>
    <LocationIndex>{result.source.index}</LocationIndex>
    <Arrow>→</Arrow>
    <LocationIndexTitle>index</LocationIndexTitle>
    <LocationIndex>{result.destination ? result.destination.index : '*'}</LocationIndex>
  </Container>
);
