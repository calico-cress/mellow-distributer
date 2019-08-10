module.exports = {
  env: {
    "node": true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    "project": "./tsconfig.json",
    "tsconfigRootDir": "."
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    // @typescript-eslint/eslint-plugin のrecommendedルールを有効化する
    "plugin:@typescript-eslint/recommended",
    // eslint-plugin-prettier／eslint-config-prettier を有効化する
    "plugin:prettier/recommended",
    // eslint-config-prettier の Eslintと競合するルールを無効化する
    "prettier/@typescript-eslint"
  ],
  rules: {
    "prettier/prettier": [
      "error",
      {
        "singleQuote": true,
        "tabWidth": 2,
        "trailingComma": "es5"
      }
    ]
  }
};