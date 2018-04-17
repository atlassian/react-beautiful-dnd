// @flow
import React from 'react';
import styled from 'styled-components';

const Container = styled.iframe`
  border: none;
`;

export default () => (
  <Container
    src="https://ghbtns.com/github-btn.html?user=atlassian&repo=react-beautiful-dnd&type=star&count=true&size=large"
    title="star count"
    frameBorder="0"
    scrolling="0"
    width="160px"
    height="30px"
  />
);
