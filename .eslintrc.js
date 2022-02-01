module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off',
    'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 0,
  },
  globals: {
    jest: true,
  },
};