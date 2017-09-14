// @flow
import styled from 'styled-components';
import { grid } from '../constants';

export default styled.h4`
  padding: ${grid}px;
  cursor: grab;
  transition: background-color ease 0.2s;
  flex-grow: 1;
  user-select: none;
`;
