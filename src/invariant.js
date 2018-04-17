// @flow

const isProduction: boolean = process.env.NODE_ENV === 'production';

// Throw an error if the condition fails
// Strip out error messages for production
export default (condition: mixed, message: string) => {
  if (condition) {
    return;
  }

  // Condition not passed

  // In production we strip the message but still throw
  if (isProduction) {
    throw new Error('Invariant failed');
  }

  // In other environments we throw with the message
  throw new Error(`Invariant failed: ${message}`);
};
