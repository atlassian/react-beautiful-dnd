// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import { Draggable } from '../../../../../src';
import { grid } from '../../../layouts/constants';
import type { DraggableProvided } from '../../../../../src';
import type { Quote as QuoteType } from '../../types';

type Props = {|
  quote: QuoteType,
  index: number,
|}

const Container = styled.div`
  background-color: ${colors.N0};
  border: 1px solid ${colors.N40};
  margin-bottom: ${grid}px;
  padding: ${grid}px;
  border-radius: 2px;
`;

export default class Item extends React.Component<Props> {
  render() {
    const { quote, index } = this.props;
    return (
      <Draggable draggableId={quote.id} index={index}>
        {(provided: DraggableProvided) => (
          <Container
            innerRef={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            Quote: {quote.id}
          </Container>
        )}
      </Draggable>
    );
  }
}
