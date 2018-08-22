// @flow
import React, { type Node } from 'react';
import CommonPage from '../CommonPage';

const Landing = ({ children }: { children: Node }) => (
  <CommonPage>{children}</CommonPage>
);

export default Landing;
