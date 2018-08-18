// @flow
import React from 'react';
import TaskApp from '../../components/examples/multi-drag/task-app';
import Layout from '../../components/layouts/example';

type Props = {
  location: {
    pathname: string,
  },
};

export default (props: Props) => (
  <Layout location={props.location}>
    <div>Multi drag: pattern</div>
    <TaskApp />
  </Layout>
);
