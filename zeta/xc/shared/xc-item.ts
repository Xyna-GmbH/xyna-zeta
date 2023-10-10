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
import { Comparable } from '../../base';
import { I18nService } from '../../i18n';


export interface XcItem {
    name?: string;
    icon?: string;
    iconStyle?: string;
    disabled?: boolean;
}

export type XcOptionItemValueType = Comparable | any;

export interface XcOptionItem<V = XcOptionItemValueType> extends XcItem {
    value: V;
}

export const XcOptionItemString    = (string = '', disabled?: boolean): XcOptionItem<string> => ({name: string, value: string, disabled});
export const XcOptionItemUndefined = (string = '', disabled?: boolean): XcOptionItem => ({name: string, value: undefined, disabled});
export const XcOptionItemTranslate = (i18n: I18nService, string = '', disabled?: boolean): XcOptionItem<string> => ({name: i18n.translate(string), value: string, disabled});

export function XcOptionItemStringOrUndefined(string?: string, disabled?: boolean): XcOptionItem<string> | undefined {
    return string !== undefined
        ? XcOptionItemString(string, disabled)
        : undefined;
}
