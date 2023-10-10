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
import { Observable } from 'rxjs';

import { XoObject, XoObjectClass, XoStructureObject } from '../../../api';
import { XcComponentTemplate, XcTemplate } from '../xc-template';


export abstract class XcContainerBaseTemplate<T extends XoTemplateDefinedBase> extends XcComponentTemplate<T> {
    abstract getChildTemplates(): Observable<XcTemplate[]>;
    abstract childTemplatesChange(): Observable<void>;
}



@XoObjectClass(null, 'xmcp.templates.datatypes', 'TemplateDefinedBase')
export class XoTemplateDefinedBase extends XoObject {
    getTemplate(): XcContainerBaseTemplate<XoTemplateDefinedBase> {
        return null;
    }


    getLabel(): string {
        return '';
    }


    /**
     * Defines the structure of this object
     *
     * If defined here, no request will be made to request the structure from Xyna.
     * Override to locally define the object's structure
     */
    getLocalStructure(): XoStructureObject {
        return null;
    }
}
