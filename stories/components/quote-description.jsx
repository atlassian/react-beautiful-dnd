// @flow
// TODO: this file can be markdown
import React, { PureComponent } from 'react';
import styled from 'styled-components';

const Container = styled.section`
`;

const TBody = styled.tbody`
  border: none;
`;

const THead = styled.tbody`
  border: none;
`;

export default class QuoteDescription extends PureComponent {
  render() {
    return (
      <Container>
        <h3>Quote list example</h3>
        <p>
          A little example application displaying some great{' '}
          <a href="https://en.wikipedia.org/wiki/Adventure_Time" target="_blank" rel="noopener noreferrer">
            Adventure time
          </a>
          {' '}quotes.
        </p>

        <p>
          Note that all the quotes are also links to other pages.
          You will find that they behave like standard links when clicked.
          However, when dragged the standard link behavior is overridden.
        </p>

        <h4>Controls</h4>
        <table>
          <THead>
            <tr>
              <th>Code</th>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </THead>
          <TBody>
            <tr>
              <td><code>{'\' \''}</code></td>
              <td>Spacebar</td>
              <td>lift / drop</td>
            </tr>
            <tr>
              <td><code>↑</code></td>
              <td>Up arrow</td>
              <td>move up an item that was lifted with a <code>spacebar</code></td>
            </tr>
            <tr>
              <td><code>↓</code></td>
              <td>Down arrow</td>
              <td>move an item that was lifted with a <code>spacebar</code></td>
            </tr>
            <tr>
              <td><code>esc</code></td>
              <td>Escape</td>
              <td>cancel an existing drag</td>
            </tr>
          </TBody>
        </table>
      </Container>
    );
  }
}
