// @flow
import React from 'react';
import styled from '@emotion/styled';
import { colors } from '@atlaskit/theme';

const GlobalStyles = styled.div`
  min-height: 100vh;
  color: ${colors.N900};
`;

const GlobalStylesDecorator = (storyFn: Function) => (
  <GlobalStyles>{storyFn()}</GlobalStyles>
);

export default GlobalStylesDecorator;
