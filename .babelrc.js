module.exports = function(api) {
  const isTest = api.env('test');
  
  return {
    presets: [
      ['@babel/preset-env', {
        targets: isTest ? { node: 'current' } : { node: '9.2.0' }
      }],
      '@babel/preset-react'
    ]
  };
};
