// @flow
import * as keyCodes from '../../src/view/key-codes';
import { timings } from '../../src/animation';
import { getDroppableSelector, getHandleSelector } from './util';

beforeEach(() => {
  cy.visit('/iframe.html?id=board--simple');
});

it('should move between lists', () => {
  // first list has item with id:2
  cy.get(getDroppableSelector())
    .eq(1)
    .as('first-list')
    .should('contain', 'id:2');

  // second list does not have item with id:2
  cy.get(getDroppableSelector())
    .eq(2)
    .as('second-list')
    .should('not.contain', 'id:2');

  cy.get('@first-list')
    .find(getHandleSelector())
    .first()
    .should('contain', 'id:2')
    .focus()
    .trigger('keydown', { keyCode: keyCodes.space })
    .trigger('keydown', { keyCode: keyCodes.arrowRight, force: true })
    // finishing before the movement time is fine - but this looks nice
    .wait(timings.outOfTheWay * 1000)
    .trigger('keydown', { keyCode: keyCodes.space, force: true });

  // no longer in the first list
  cy.get('@first-list').should('not.contain', 'id:2');

  // now in the second list
  cy.get('@second-list').should('contain', 'id:2');
});
