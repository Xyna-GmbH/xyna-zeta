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
import { XcTemplate } from '../../xc';
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '../../api';


@XoObjectClass(null, 'xmcp', 'DocumentationLanguage')
export class XoDocumentationLanguage extends XoObject {

    /**
     * Values:
     * en-US
     * de-DE
     */
    @XoProperty()
    @XoUnique()
    languageTag: string;
}

@XoArrayClass(XoDocumentationLanguage)
export class XoDocumentationLanguageArray extends XoArray<XoDocumentationLanguage> {
}



@XoObjectClass(null, 'xmcp', 'Documentation')
export class XoDocumentation extends XoObject {

    @XoProperty(XoDocumentationLanguage)
    language: XoDocumentationLanguage = new XoDocumentationLanguage();

    @XoProperty()
    documentation: string;
}

@XoArrayClass(XoDocumentation)
export class XoDocumentationArray extends XoArray<XoDocumentation> {
}



@XoObjectClass(null, 'xmcp.factorymanager.xynaproperties', 'XynaProperty')
export class XoXynaProperty extends XoObject {

    @XoProperty()
    @XoUnique()
    key: string;

    @XoProperty()
    value: string;

    @XoProperty()
    @XoTransient()
    templates: XcTemplate[];

    @XoProperty()
    defaultValue: string;

    @XoProperty(XoDocumentationArray)
    documentation: XoDocumentationArray = new XoDocumentationArray();

    @XoProperty()
    gUIDocumentation: string;

    @XoProperty()
    overwrittenDefaultValue: boolean;

    static createTemplatesFn: (model: XoXynaProperty) => XcTemplate[];


    afterDecode() {
        super.afterDecode();
        this.templates = XoXynaProperty.createTemplatesFn?.(this) ?? [];
    }


    get valueOrDefault(): string {
        return this.value ?? this.defaultValue;
    }
}

@XoArrayClass(XoXynaProperty)
export class XoXynaPropertyArray extends XoArray<XoXynaProperty> {
}




@XoObjectClass(null, 'xmcp.factorymanager.xynaproperties', 'XynaPropertyKey')
export class XoXynaPropertyKey extends XoObject {

    @XoProperty()
    key: string;


    static withKey(key: string): XoXynaPropertyKey {
        const result = new this();
        result.key = key;
        return result;
    }
}

@XoArrayClass(XoXynaPropertyKey)
export class XoXynaPropertyKeyArray extends XoArray<XoXynaPropertyKey> {
}
