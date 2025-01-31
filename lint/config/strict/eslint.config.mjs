import baseConfig from '../base/eslint.config.mjs';

export default [
    ...baseConfig,
    {
        rules: {
            // --------------------------------------------------------------------------------------------------------------------------------
            // typescript supported rules |
            // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/README.md#supported-rules
            // --------------------------------------------------------------------------------------------------------------------------------
            "@typescript-eslint/adjacent-overload-signatures": "warn",                                      // recommended
            "@typescript-eslint/explicit-member-accessibility": ["warn", { "accessibility": "no-public" }],
            // "@typescript-eslint/member-delimiter-style": ["warn", { "multiline": { "delimiter": "semi", "requireLast": true }, "singleline": { "delimiter": "semi", "requireLast": false } }],
            "@typescript-eslint/no-floating-promises": "error",                                             // recommended                                            // recommended
            "@typescript-eslint/no-inferrable-types": "warn",                                               // recommended
            "@typescript-eslint/no-this-alias": "error",                                                    // recommended
            // "@typescript-eslint/type-annotation-spacing": "warn",
            "@typescript-eslint/unbound-method": ["error", { "ignoreStatic": true }],                         // recommended

            // --------------------------------------------------------------------------------------------------------------------------------
            // typescript extension rules |
            // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/README.md#extension-rules
            // --------------------------------------------------------------------------------------------------------------------------------
            // "@typescript-eslint/comma-dangle": "warn",
            // "@typescript-eslint/comma-spacing": "warn",
            "indent": "off",                            // switch off default indent
            //"@typescript-eslint/indent": "warn",
            // "@typescript-eslint/indent": ["warn", 4, { "ignoredNodes": ["[attr='foo']"] }],
            "@typescript-eslint/indent": ["warn", {
                "SwitchCase": 1,
                "ignoredNodes": ["Identifier"],
                "indent": 4
            }],
            // "@typescript-eslint/indent": ["warn", 4, { "ignoredNodes": ["Decorator:matches([expression.callee.name='Input'])"] }],
            // "@typescript-eslint/indent": ["warn", 4, { "": 2 }],
            "@typescript-eslint/keyword-spacing": "warn",
            "@typescript-eslint/space-before-function-paren": ["warn", { "anonymous": "never", "named": "never", "asyncArrow": "always" }],
            "@typescript-eslint/space-infix-ops": "warn",

            // --------------------------------------------------------------------------------------------------------------------------------
            // best practices | https://eslint.org/docs/rules/#best-practices
            // --------------------------------------------------------------------------------------------------------------------------------
            "curly": "error",
            "no-else-return": ["error", { "allowElseIf": false }],
            "no-useless-concat": "warn",
            "yoda": ["warn", "never", { "exceptRange": true }],

            // --------------------------------------------------------------------------------------------------------------------------------
            // stylistic issues | https://eslint.org/docs/rules/#stylistic-issues
            // --------------------------------------------------------------------------------------------------------------------------------
            "block-spacing": "warn",
            "comma-style": "warn",
            "eol-last": "warn",
            "no-whitespace-before-property": "warn",
            "operator-assignment": "warn",
            "space-before-blocks": "warn",
            "space-in-parens": "warn",
            "space-unary-ops": "warn",
            "switch-colon-spacing": "warn",

            // --------------------------------------------------------------------------------------------------------------------------------
            // es6 | https://eslint.org/docs/rules/#ecmascript-6
            // --------------------------------------------------------------------------------------------------------------------------------
            "arrow-body-style": "warn",
            "arrow-parens": ["warn", "as-needed"],
            "arrow-spacing": "warn",
            "rest-spread-spacing": "warn",
            "template-curly-spacing": "warn",

            "brace-style": [2, "1tbs"]
        }
    }
];