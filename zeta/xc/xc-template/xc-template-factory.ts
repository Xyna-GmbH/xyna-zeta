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
import { Xo, XoStructureField } from '../../api';
import { defineAccessorProperty } from '../../base';
import { XcIdentityDataWrapper, XcStringFloatDataWrapper, XcStringIntegerDataWrapper } from '../shared/xc-data-wrapper';
import { XcAutocompleteDataWrapper } from '../xc-form/xc-form-autocomplete/xc-form-autocomplete.component';
import { XcFormValidatorNumber } from '../xc-form/xc-form-base/xc-form-validators.directive';
import { XcCheckboxTemplate, XcFormAutocompleteTemplate, XcFormInputTemplate, XcFormTemplate, XcTemplate } from './xc-template';


export class XcTemplateFactory {

    static readonly PLACEHOLDER_ZERO  = '0';
    static readonly PLACEHOLDER_NULL  = '{null}';
    static readonly PLACEHOLDER_FALSE = 'false';


    static createTemplates(field: XoStructureField, instance: Xo, readonly = false, autocompleteValuesChange?: () => void): XcTemplate[] {
        const create = (getter: () => any, setter: (value: any) => void, nullable: boolean): XcTemplate[] => {
            const templates: XcTemplate[] = [];

            // enumerated data wrapper
            const enumeratedDataWrapper = XcAutocompleteDataWrapper.fromXoEnumeratedPropertyPath(instance, field.path, nullable, {options: () => {
                // notify the caller about the autocomplete datawrapper's options change
                if (autocompleteValuesChange) {
                    autocompleteValuesChange();
                }
            }});

            // is field enumerated?
            if (enumeratedDataWrapper) {
                templates.push(new XcFormAutocompleteTemplate(enumeratedDataWrapper));
            }
            // boolean
            else if (field.typeFqn.boolLike) {
                // autocomplete data wrapper
                const autocompleteDataWrapper = new XcAutocompleteDataWrapper(
                    getter,
                    setter,
                    [{name: false.toString(), value: false}, {name: true.toString(), value: true}],
                    nullable
                );
                // create checkbox template
                const checkboxTemplate = new XcCheckboxTemplate(new XcIdentityDataWrapper(
                    getter,
                    value => {
                        setter(value);
                        // update datawrapper, since it can't recognize underlying model changes
                        autocompleteDataWrapper.update();
                    }
                ));
                // specify indeterminate accessor for checkbox template
                if (nullable) {
                    defineAccessorProperty<XcCheckboxTemplate, boolean>(
                        checkboxTemplate,
                        'indeterminate',
                        () => getter() == null
                    );
                }
                templates.push(checkboxTemplate);
                templates.push(new XcFormAutocompleteTemplate(autocompleteDataWrapper));
            }
            // string
            else if (field.typeFqn.stringLike) {
                templates.push(new XcFormInputTemplate(new XcIdentityDataWrapper(getter, setter)));
            }
            // integer, long
            else if (field.typeFqn.intLike) {
                templates.push(new XcFormInputTemplate(new XcStringIntegerDataWrapper(getter, setter, nullable), [XcFormValidatorNumber('decimal')]));
            }
            // float, double
            else if (field.typeFqn.floatLike) {
                templates.push(new XcFormInputTemplate(new XcStringFloatDataWrapper(getter, setter, nullable), [XcFormValidatorNumber('float')]));
            }
            return templates;
        };

        return this.createTemplatesWithParameters(field, instance, create, readonly);
    }



    static createTemplatesWithParameters(field: XoStructureField, instance: Xo,
        createFn: (getter: () => any, setter: (value: any) => void, nullable: boolean) => XcTemplate[],
        readonly = false
    ): XcTemplate[] {
        // set nullable and placeholder
        const nullable = field.typeFqn.isNullablePrimitive();
        const placeholder = nullable
            ? XcTemplateFactory.PLACEHOLDER_NULL
            : field.typeFqn.isNumericPrimitive()
                ? XcTemplateFactory.PLACEHOLDER_ZERO
                : XcTemplateFactory.PLACEHOLDER_FALSE;

        // define setter, getter and init
        const setter = (value: any) => instance.resolveAssign(field.path, value);
        const getter = (): any      => instance.resolve(field.path);
        const init   = (): any      => {
            const value = getter();
            return nullable && value == null && setter(null), value;
        };

        // readonly mode: return text
        if (readonly) {
            const value = init();
            const text  = value != null
                ? (field.typeFqn.stringLike ? '"' +  value + '"' : value)
                : placeholder;
            return [text];
        }

        // create templates
        const templates: XcTemplate[] = createFn ? createFn(getter, setter, nullable) : [];

        // extend form templates
        templates.forEach(template => {
            if (template instanceof XcFormTemplate) {
                // specify placeholder accessor (if placeholder has not been set before)
                if (!template.placeholder) {
                    defineAccessorProperty<typeof template, string>(
                        template,
                        'placeholder',
                        () => getter() == null ? placeholder : ''
                    );
                }
                // suffix for nullable primitives
                if (nullable) {
                    template.suffix = 'nullify';
                }
                // set label
                template.label = field.label;
            }
        });

        init();
        return templates;
    }
}
