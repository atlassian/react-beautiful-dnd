// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';
import { getHandleSelector } from './util';

describe('reorder: virtual', () => {
  beforeEach(() => {
    cy.visit('/iframe.html?id=virtual--list-with-react-window');
  });

  it('should reorder within a list', () => {
    const movements: number = 12;

    cy.get(getHandleSelector())
      .first()
      .as('item');

    cy.get('@item')
      .invoke('attr', 'data-testid')
      .as('item-id');

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
        .wait(timings.outOfTheWay * 1000);
    });

    // drop
    cy.get('@item').trigger('keydown', {
      keyCode: keyCodes.space,
      force: true,
    });

    cy.get('@item-id').then(id => {
      cy.get(getHandleSelector(id))
        .invoke('attr', 'data-index')
        .should('equal', `${movements}`);
    });
  });
});
