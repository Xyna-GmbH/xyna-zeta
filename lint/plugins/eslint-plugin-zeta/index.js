/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
const rules = {
    'xo': {
        meta: {
            fixable: 'code',
            type: 'problem'
        },
        create: function(context) {

            const XO_OBJECT_DECORATOR_NAME = 'XoObjectClass';
            const XO_ARRAY_DECORATOR_NAME = 'XoArrayClass';

            const XO_PROPERTY_DECORATOR_NAME = 'XoProperty';
            const XO_TRANSIENT_DECORATOR_NAME = 'XoTransient';

            let decoratorClass;
            let decoratorClassConstructorNode;

            function isXoClass(name) {
                return name === 'Xo' || name === 'XoObject' || name === 'XoArray';
            }

            function getDecorator(node, name) {
                return node.decorators && node.decorators.find(decorator => {
                    const expression = decorator.expression;
                    return (expression.name === name) || (expression.callee && expression.callee.name === name);
                });
            }

            return {
                'ImportDeclaration'(node) {
                    let idx;
                    if ((idx = node.source.value.indexOf('zeta/')) !== -1 && node.source.value[idx - 1] !== '@') {
                        context.report({
                            node,
                            message: 'Import zeta dependencies via the \'@zeta\' alias.'
                        });
                    }
                    if ((idx = node.source.value.indexOf('environment.prod')) !== -1) {
                        context.report({
                            node,
                            message: 'Import from \'environment\' instead of from \'environment.prod\'.'
                        });
                    }
                },
                'ClassDeclaration'(node) {
                    let decorator;
                    if ((decorator = getDecorator(node, XO_OBJECT_DECORATOR_NAME))) {
                        decoratorClass = XO_OBJECT_DECORATOR_NAME;
                        const baseClassArgument = decorator.expression.arguments
                            ? decorator.expression.arguments[0]
                            : undefined;
                        if (baseClassArgument) {
                            const superClassName = node.superClass
                                ? node.superClass.name
                                : undefined;
                            if (baseClassArgument.value === null && superClassName !== 'XoObject') {
                                context.report({
                                    node: decorator,
                                    message: 'A class decorated by XoObjectClass with baseClass == null must directly extend XoObject.'
                                });
                            }
                            if (baseClassArgument.name && baseClassArgument.name !== superClassName) {
                                context.report({
                                    node: decorator,
                                    message: 'A class decorated by XoObjectClass with baseClass == \'' + baseClassArgument.name + '\' must directly extend ' + baseClassArgument.name + '.'
                                });
                            }
                        }
                        if (node.id && !node.id.name.startsWith('Xo')) {
                            context.report({
                                node,
                                message: 'The name of a class decorated by XoObjectClass must start with \'Xo\'.'
                            });
                        }
                    }
                    else if ((decorator = getDecorator(node, XO_ARRAY_DECORATOR_NAME))) {
                        decoratorClass = XO_ARRAY_DECORATOR_NAME;
                        const superTypeParameter = node.superTypeParameters
                            ? node.superTypeParameters.params[0]
                            : undefined;
                        if (!superTypeParameter) {
                            context.report({
                                node,
                                message: 'A class decorated by XoArrayClass must have a super type parameter.'
                            });
                        } else if (node.id) {
                            const className = node.id.name;
                            const superTypeParameterName = superTypeParameter.typeName.name;
                            const typeParameter = node.typeParameters
                                ? node.typeParameters.params.find(param => param.name.name === superTypeParameterName)
                                : undefined;
                            const typeParameterConstraintName = typeParameter && typeParameter.constraint && typeParameter.constraint.typeName
                                ? typeParameter.constraint.typeName.name
                                : undefined;
                            if ((typeParameterConstraintName && !className.startsWith(typeParameterConstraintName)) ||
                                (!typeParameterConstraintName && !className.startsWith(superTypeParameterName))) {
                                context.report({
                                    node,
                                    message: 'The name of a class decorated by XoArrayClass must start with the name of its super type parameter.'
                                });
                            }
                        }
                    }
                },
                'ClassDeclaration:exit'(node) {
                    if (getDecorator(node, XO_OBJECT_DECORATOR_NAME) || getDecorator(node, XO_ARRAY_DECORATOR_NAME)) {
                        decoratorClass = undefined;
                    }
                },
                'ClassProperty'(node) {
                    if (decoratorClass === XO_OBJECT_DECORATOR_NAME) {
                        const propertyDecorator = getDecorator(node, XO_PROPERTY_DECORATOR_NAME);
                        if (propertyDecorator) {
                            const transientDecorator = getDecorator(node, XO_TRANSIENT_DECORATOR_NAME);
                            if (!transientDecorator) {
                                const propertyClassArgument = propertyDecorator.expression.arguments
                                    ? propertyDecorator.expression.arguments[0]
                                    : undefined;
                                const typeName = node.typeAnnotation && node.typeAnnotation.typeAnnotation.typeName
                                    ? node.typeAnnotation.typeAnnotation.typeName.name
                                    : undefined;
                                const calleeName = node.value !== null && node.value.type === 'NewExpression'
                                    ? node.value.callee.name
                                    : undefined;
                                if (propertyClassArgument && propertyClassArgument.name !== typeName && propertyClassArgument.name !== calleeName) {
                                    context.report({
                                        node,
                                        message: 'An non-transient XoProperty with the decorator argument \'' + propertyClassArgument.name + '\' must be of the same type.'
                                    });
                                } else {
                                    if (typeName && !isXoClass(typeName) && (!propertyClassArgument || typeName !== propertyClassArgument.name)) {
                                        context.report({
                                            node,
                                            message: 'An non-transient XoProperty of type \'' + typeName + '\' must call the decorator with the same type.'
                                        });
                                    }
                                    if (calleeName && !isXoClass(calleeName) && (!propertyClassArgument || calleeName !== propertyClassArgument.name)) {
                                        context.report({
                                            node,
                                            message: 'An non-transient XoProperty initialized with a new instance of \'' + calleeName + '\' must call the decorator with the same type.'
                                        });
                                    }
                                }
                            }
                            if (node.decorators.indexOf(propertyDecorator) !== 0) {
                                context.report({
                                    node: propertyDecorator,
                                    message: 'The XoProperty decorator must be the first decorator in the chain.'
                                });
                            }
                        }
                    }
                },
                'MethodDefinition'(node) {
                    if (decoratorClass && node.kind === 'constructor') {
                        decoratorClassConstructorNode = node;
                        const param = node.value.params[0];
                        if (!param || !param.optional || param.name !== '_ident' || param.typeAnnotation.typeAnnotation.type !== 'TSStringKeyword') {
                            context.report({
                                node,
                                message: 'A constructor of a class decorated by ' + decoratorClass + ' must have \'_ident?: string\' as its first argument.'
                            });
                        }
                    }
                },
                'MethodDefinition:exit'(node) {
                    if (decoratorClass && node.kind === 'constructor') {
                        decoratorClassConstructorNode = undefined;
                    }
                },
                'CallExpression'(node) {
                    if (decoratorClassConstructorNode && node.callee.type === 'Super') {
                        const arg = node.arguments[0];
                        if (!arg || arg.name !== '_ident') {
                            context.report({
                                node,
                                message: 'A constructor of a class decorated by ' + decoratorClass + ' must call super with \'_ident\' as its first argument.'
                            });
                        }
                    }
                }
            };
        }
    }
};


// eslint-disable-next-line no-undef
module.exports = {
    rules
};
