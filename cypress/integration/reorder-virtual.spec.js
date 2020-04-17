// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';
import { getHandleSelector } from './util';

describe('reorder: virtual', () => {
  beforeEach(() => {
    cy.visit('/iframe.html?id=virtual-react-window--list');
  });

  it('should reorder within a list', () => {
    const movements: number = 12;

    cy.get(getHandleSelector()).first().as('item');

    cy.get('@item').invoke('attr', 'data-testid').as('item-id');

    cy.get('@item')
      .invoke('attr', 'data-index')
      .as('item-index')
      .should('equal', '0');

    // lift
    cy.get('@item')
      .focus()
      .trigger('keydown', { keyCode: keyCodes.space })
      // need to re-query for a clone
      .get('@item');

    cy.wrap(Array.from({ length: movements })).each(() => {
      cy.get('@item')
        .trigger('keydown', { keyCode: keyCodes.arrowDown, force: true })
        // finishing before the movement time is fine - but this looks nice
        // waiting longer than we should (timings.outOfTheWay * 1000) as electron is being strange
        .wait(timings.outOfTheWay * 1000 * 2);
    });

    // drop
    cy.get('@item').trigger('keydown', {
      keyCode: keyCodes.space,
      force: true,
    });

    // This is setting up a chain of commands and this test will not wait
    // for a 'promise' to resolve. Linting is getting confused by .then
    // eslint-disable-next-line jest/valid-expect-in-promise
    cy.get('@item-id').then((id) => {
      cy.get(getHandleSelector(id))
        .invoke('attr', 'data-index')
        .should('equal', `${movements}`);
    });
  });
});
