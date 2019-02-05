// @flow
import React from 'react';
import styled from 'styled-components';
import { colors } from '@atlaskit/theme';
import { grid } from '../../stories/src/constants';

const GlobalStyles = styled.div`
  background-color: ${colors.N0};
  box-sizing: border-box;
  padding: ${grid * 2}px;
  min-height: 100vh;
`;

const GlobalStylesDecorator = (storyFn: Function) => (
  <GlobalStyles>{storyFn()}</GlobalStyles>
);

export default GlobalStylesDecorator;
