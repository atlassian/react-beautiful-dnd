// @flow
import styled from 'styled-components';
import { colors, grid } from '../constants';

export default styled.h4`
  padding: ${grid}px;
  cursor: grab;
  transition: background-color ease 0.2s;
  flex-grow: 1;
  user-select: none;
  position: relative;
  &:focus {
    outline: 2px solid ${colors.purple};
    outline-offset: 2px;
  }
`;
