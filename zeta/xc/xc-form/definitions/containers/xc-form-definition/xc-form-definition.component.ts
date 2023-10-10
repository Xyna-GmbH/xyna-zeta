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

import { XcBaseDefinitionComponent } from '../../shared/xc-base-definition/xc-base-definition.component';
import { XoFormDefinition } from '../../xo/containers.model';


@Component({
    selector: 'xc-form-definition',
    templateUrl: './xc-form-definition.component.html',
    styleUrls: ['./xc-form-definition.component.scss']
})
export class XcFormDefinitionComponent extends XcBaseDefinitionComponent {

    @Input('xc-form-definition')
    set formDefinition(value: XoFormDefinition) {
        this.definition = value;
    }


    get formDefinition(): XoFormDefinition {
        return this.definition as XoFormDefinition;
    }
}
