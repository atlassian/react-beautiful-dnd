module.exports = {
  rules: {
    // allowing console.warn / console.error
    // this is because we often mock console.warn and console.error and adding this rul
    // avoids needing to constantly be opting out of the rule
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};
