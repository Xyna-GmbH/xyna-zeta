import baseConfig from '../base/eslint.config.js';

export default [
    {
        rules: {
            ...baseConfig.rules,

            // --------------------------------------------------------------------------------------------------------------------------------
            // typescript supported rules |
            // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/README.md#supported-rules
            // --------------------------------------------------------------------------------------------------------------------------------
            '@typescript-eslint/adjacent-overload-signatures': 'warn',                                                      // recommended
            '@typescript-eslint/explicit-member-accessibility': ['warn', { 'accessibility': 'no-public' }],                 // recommended
            '@typescript-eslint/no-floating-promises': 'error',                                                             // recommended
            '@typescript-eslint/no-inferrable-types': 'warn',                                                               // recommended
            '@typescript-eslint/no-this-alias': 'error',                                                                    // recommended
            '@typescript-eslint/unbound-method': ['error', { 'ignoreStatic': true }],                                       // recommended
            '@typescript-eslint/indent': 'off',


            // --------------------------------------------------------------------------------------------------------------------------------
            // typescript extension rules |
            // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/README.md#extension-rules
            // --------------------------------------------------------------------------------------------------------------------------------
            'indent': 'off',                                                                                                // switch off default indent
            'stylistic/comma-dangle': 'warn',
            'stylistic/comma-spacing': 'warn',
            'stylistic/indent': ['warn', 4, { SwitchCase: 1, ignoredNodes: ['Identifier'] }],
            'stylistic/block-spacing': 'warn',
            'stylistic/comma-style': 'warn',
            'stylistic/eol-last': 'warn',
            'stylistic/no-whitespace-before-property': 'warn',
            'stylistic/space-before-blocks': 'warn',
            'stylistic/space-in-parens': 'warn',
            'stylistic/space-unary-ops': 'warn',
            'stylistic/switch-colon-spacing': 'warn',
            'stylistic/keyword-spacing': 'warn',
            'stylistic/space-before-function-paren': ['warn', { 'anonymous': 'never', 'named': 'never', 'asyncArrow': 'always' }],
            'stylistic/space-infix-ops': 'warn',
            'stylistic/member-delimiter-style': ['warn', { 'multiline': { 'delimiter': 'semi', 'requireLast': true }, 'singleline': { 'delimiter': 'semi', 'requireLast': false } }],
            'stylistic/type-annotation-spacing': 'warn',

            // --------------------------------------------------------------------------------------------------------------------------------
            // best practices | https://eslint.org/docs/rules/#best-practices
            // --------------------------------------------------------------------------------------------------------------------------------
            'curly': 'error',
            'no-else-return': ['error', { 'allowElseIf': false }],
            'no-useless-concat': 'warn',
            'yoda': ['warn', 'never', { 'exceptRange': true }],

            // --------------------------------------------------------------------------------------------------------------------------------
            // stylistic issues | https://eslint.org/docs/rules/#stylistic-issues
            // --------------------------------------------------------------------------------------------------------------------------------
            'block-spacing': 'warn',
            'comma-style': 'warn',
            'eol-last': 'warn',
            'no-whitespace-before-property': 'warn',
            'operator-assignment': 'warn',
            'space-before-blocks': 'warn',
            'space-in-parens': 'warn',
            'space-unary-ops': 'warn',
            'switch-colon-spacing': 'warn',

            // --------------------------------------------------------------------------------------------------------------------------------
            // es6 | https://eslint.org/docs/rules/#ecmascript-6
            // --------------------------------------------------------------------------------------------------------------------------------
            'arrow-body-style': 'warn',
            'arrow-parens': ['warn', 'as-needed'],
            'arrow-spacing': 'warn',
            'rest-spread-spacing': 'warn',
            'template-curly-spacing': 'warn',

            'brace-style': [2, '1tbs']
        }
    }
];