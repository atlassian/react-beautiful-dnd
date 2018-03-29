// @flow
import React, { Component } from 'react';
import Link from 'gatsby-link';
import styled from 'styled-components';
import UserLinks from '../UserLinks';
import theme from '../../layouts/theme';

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  background: ${theme.brand};

  .nav-link {
    font-size: 1.6rem;
    margin-right: 10px;
    font-weight: 200;
    color: ${theme.lightGrey};
    text-decoration: none;
    border-bottom: none;
    &:hover {
      text-decoration: underline solid ${theme.lightGrey};
    }
  }

  @media screen and (max-width: 600px) {
    display: flex;
    flex-direction: column;
    align-items: center;

    section {
      margin-bottom: 20px;
    }

    span {
      display: none;
    }

  }
`;

class Navigation extends Component<*, *> {
  render() {
    return (
      <NavContainer>
        <section>
          <Link className="nav-link" to="/" href="/" > Home </Link>
          {/* <Link className="nav-link" to="/about" > About </Link> */}
          <Link className="nav-link" href="/patterns" to="/patterns" > Patterns </Link>
          <Link className="nav-link" href="/guides" to="/guides" > Guides </Link>
          <Link className="nav-link" href="/examples" to="/examples" > Examples </Link>
        </section>
        <span><UserLinks /></span>
      </NavContainer>
    );
  }
}

export default Navigation;
