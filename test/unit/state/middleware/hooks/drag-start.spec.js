// @flow

describe('start', () => {
  it('should call the onDragStart hook when a initial publish occurs', () => {

  });

  it('should throw an exception if an initial publish is called before a drag ends', () => {

  });
});

describe('drop', () => {
  it('should call the onDragEnd hook when a DROP_COMPLETE action occurs', () => {

  });

  it('should throw an exception if there was no drag start published', () => {

  });
});

describe('cancel', () => {
  it('should publish an on drag end with no destination', () => {

  });

  // the start location can change after a dynamic update
  it('should use the current critical descriptor as the start location', () => {

  });

  it('should not do anything if a drag start had not been published', () => {

  });
});

describe('update', () => {

});

describe('announcements', () => {

});
