// @flow
import React from 'react';
import Link from 'gatsby-link';
import { colors, grid } from '../../layouts/constants';

const Header = () => (
  <div
    style={{
      background: colors.brand,
      marginBottom: grid,
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
          react-beautiful-dnd
        </Link>
      </h1>
    </div>
  </div>
);

export default Header;
