// @flow
import React from 'react';
import CommonPage from '../components/CommonPage';

const Landing = ({ children }) => (
  <CommonPage>{children()}</CommonPage>
);

export default Landing;
