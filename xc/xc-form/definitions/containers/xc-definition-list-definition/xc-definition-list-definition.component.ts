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
import { Component, Input } from '@angular/core';

import { XoDefinitionListDefinition } from '../../xo/containers.model';
import { XcFormDefinitionComponent } from '../xc-form-definition/xc-form-definition.component';


@Component({
    selector: 'xc-definition-list-definition',
    templateUrl: './xc-definition-list-definition.component.html',
    styleUrls: ['./xc-definition-list-definition.component.scss']
})
export class XcDefinitionListDefinitionComponent extends XcFormDefinitionComponent {

    @Input('xc-definition-list-definition')
    set definitionListDefinition(value: XoDefinitionListDefinition) {
        this.definition = value;
    }


    get definitionListDefinition(): XoDefinitionListDefinition {
        return this.definition as XoDefinitionListDefinition;
    }
}
