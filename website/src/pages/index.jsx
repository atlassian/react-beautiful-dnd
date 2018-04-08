// @flow
import React from 'react';
import Link from 'gatsby-link';

const IndexPage = () => (
  <div>
    <h1>React Beautiful-DnD</h1>
    <p>
      This site is still under construction. You can view our examples{' '}
      <Link href="/examples" to="/examples">
        here
      </Link>, or check out or existing docs{' '}
      <a href="https://github.com/atlassian/react-beautiful-dnd">
        on github
      </a>.
    </p>
    <p>
      New docs will live{' '}
      <Link href="/docs" to="/docs">
        here
      </Link>
    </p>
  </div>
);

export default IndexPage;
