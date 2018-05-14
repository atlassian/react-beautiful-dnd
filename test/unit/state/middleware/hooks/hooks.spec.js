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

  it('should call the onDragEnd with the drop reason', () => {

  });

  it('should throw an exception if there was no drag start published', () => {

  });
});

describe('update', () => {
  it('should call onDragUpdate if the position has changed', () => {

  });

  it('should not call onDragUpdate if the position has not changed from the last update', () => {

  });

  it('should not call onDragUpdate if there is no movement from the initial location', () => {

  });
});

describe('abort', () => {
  it('should use the last citical descriptor as the start location', () => {

  });

  it('should publish an on drag end with no destination even if there is a current destination', () => {

  });

  it('should not do anything if a drag start had not been published', () => {

  });
});

describe('announcements', () => {

});
