// @flow
import React from 'react';
import styled from 'react-emotion';
import Layout from '../components/layouts';
import { grid } from '../constants';
import Logo from '../components/egghead-logo';

const courseUrl =
  'https://egghead.io/courses/beautiful-and-accessible-drag-and-drop-with-react-beautiful-dnd';

const Aye = styled.a`
  margin: auto;
  display: block;
  width: 424px;
  text-align: center;
  margin-top: ${grid * 5}px;
`;

export default () => (
  <Layout>
    <Aye href={courseUrl}>
      <Logo />
      <h2>Check out our free egghead course to get started</h2>
    </Aye>
  </Layout>
);
