// @flow
import React, { Component } from 'react';
import styled from 'styled-components';
import type { Task } from './types';

type Props = {|
  task: Task
|}

const Container = styled.div`
  background: lightblue;
`;

export class Task extends Component<Props> {
  render() {
    return (
      <Container>{this.props.task.content}</Container>
    );
  }
}
