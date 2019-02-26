// @flow
import { Selector } from 'testcafe';
import * as attributes from '../../src/view/data-attributes';

const urlSimpleList =
  'http://localhost:9002/iframe.html?selectedKind=single%20vertical%20list&selectedStory=basic';
const errorMessage = 'Reorder unsuccessful';

/* Css selectors used */
const singleListContainer: string = `[${attributes.droppable}]`;
const firstCard: string = `[${attributes.dragHandle}]:nth-child(1)`;
const secondCard: string = `[${attributes.dragHandle}]:nth-child(2)`;
const fourthCard: string = `[${attributes.dragHandle}]:nth-child(5)`;

// fixture is not defined
/* eslint-disable */
// $FlowFixMe - need to fix this api
fixture`Simple List Test Case`.page`${urlSimpleList}`.beforeEach(async t => {
  await t
    .navigateTo(urlSimpleList)
    .expect(Selector(singleListContainer).visible)
    .ok();
});
/* eslint-enable */

test('Drag and drop using click / drag', async t => {
  const textBefore = await Selector(secondCard).innerText;
  await t.dragToElement(secondCard, fourthCard, { speed: 0.5 }).wait(500);
  const textAfter = await Selector(secondCard).innerText;
  await t.expect(textBefore).notEql(textAfter, errorMessage);
});
test('Drag and drop using keyboard interactions', async t => {
  const textBefore = await Selector(firstCard).innerText;
  await t
    .pressKey('tab')
    .pressKey('space')
    .pressKey('down')
    .pressKey('down')
    .pressKey('space')
    .wait(500);
  const textAfter = await Selector(secondCard).innerText;
  await t.expect(textBefore).notEql(textAfter, errorMessage);
});
