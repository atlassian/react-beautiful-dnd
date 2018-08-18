// @flow
import React from 'react';
import Simple from '../../components/examples/simple/simple';
import Layout from '../../components/layouts/example';

type Props = {
  location: {
    pathname: string,
  },
};

export default (props: Props) => (
  <Layout location={props.location}>
    <div>Super Simple: Vertical List</div>
    <Simple />
  </Layout>
);
