// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';
import { getHandleSelector } from './util';
import ports from '../../server-ports';

function commonTest(url: string, cspTest: string) {
  cy.visit(url);

  cy.get(getHandleSelector()).eq(0).as('first').should('contain', 'item 0');
  cy.get(getHandleSelector()).eq(1).should('contain', 'item 1');

  // reorder operation
  cy.get('@first')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    // need to re-query for a clone
    .get('@first')
    .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  // order now 2, 1
  // note: not using get aliases as they where returning incorrect results
  cy.get(getHandleSelector()).eq(0).should('contain', 'item 1');

  cy.get(getHandleSelector()).eq(1).should('contain', 'item 0');

  // element should maintain focus post drag
  cy.focused().should('contain', 'item 0');

  cy.get('#cspErrors').should(cspTest, '0');
}

describe('content security policy', () => {
  it('should reorder a list without a nonce', () => {
    commonTest(`http://localhost:${ports.cspServer}`, 'contain');
  });

  it('should reorder a list with a nonce', () => {
    commonTest(`http://localhost:${ports.cspServer}/nonce`, 'contain');
  });

  it('should reorder a list with a wrong nonce', () => {
    commonTest(
      `http://localhost:${ports.cspServer}/wrong-nonce`,
      'not.contain',
    );
  });
});
