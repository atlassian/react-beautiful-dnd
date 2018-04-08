// @flow
import React from 'react';
import Link from 'gatsby-link';
import theme from '../../layouts/theme';

const Header = () => (
  <div
    style={{
      background: theme.brand,
      marginBottom: '1.45rem',
    }}
  >
    <div
      style={{
        margin: '0 auto',
        maxWidth: 960,
        padding: '1.45rem 1.0875rem',
      }}
    >
      <h1 style={{ margin: 0 }}>
        <Link
          href="/"
          to="/"
          style={{
            color: 'white',
            textDecoration: 'none',
          }}
        >
          react beatuiful-dnd
        </Link>
      </h1>
    </div>
  </div>
);

export default Header;
