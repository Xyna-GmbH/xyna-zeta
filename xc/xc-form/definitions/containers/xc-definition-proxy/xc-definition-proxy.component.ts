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

import { first } from 'rxjs/operators';

import { XcTemplate } from '../../../../xc-template/xc-template';
import { XcBaseDefinitionComponent } from '../../shared/xc-base-definition/xc-base-definition.component';
import { XoBaseDefinition } from '../../xo/base-definition.model';
import { XoDefinitionListDefinition, XoFormDefinition, XoFormPanelDefinition, XoPredefinedTablePanelDefinition, XoTablePanelDefinition, XoTreePanelDefinition } from '../../xo/containers.model';


@Component({
    selector: 'xc-definition-proxy',
    templateUrl: './xc-definition-proxy.component.html',
    styleUrls: ['./xc-definition-proxy.component.scss'],
    standalone: false
})
export class XcDefinitionProxyComponent extends XcBaseDefinitionComponent {

    template: XcTemplate;

    readonly PredefinedTablePanelDefinition: typeof XoPredefinedTablePanelDefinition = XoPredefinedTablePanelDefinition;   // FIXME deprecated (see ZETA-177)
    readonly TablePanelDefinition: typeof XoTablePanelDefinition = XoTablePanelDefinition;
    readonly TreePanelDefinition: typeof XoTreePanelDefinition = XoTreePanelDefinition;
    readonly PanelDefinition: typeof XoFormPanelDefinition = XoFormPanelDefinition;
    readonly DefinitionListDefinition: typeof XoDefinitionListDefinition = XoDefinitionListDefinition;
    readonly FormDefinition: typeof XoFormDefinition = XoFormDefinition;

    // REMARK: More specific types first (order is crucial)
    private readonly classes = [
        this.PredefinedTablePanelDefinition,
        this.TablePanelDefinition,
        this.TreePanelDefinition,
        this.PanelDefinition,
        this.DefinitionListDefinition,
        this.FormDefinition
    ];


    @Input('xc-base-definition')
    set baseDefinition(value: XoBaseDefinition) {
        this.definition = value;
    }


    get baseDefinition(): XoBaseDefinition {
        return this.definition;
    }


    protected afterUpdate() {
        super.afterUpdate();

        this.definition.getTemplate(this.definitionData)?.pipe(first()).subscribe(template => this.template = template);   // don't pass resolved data here. Will be resolved later
    }


    // ---------------------------------------------------------------------------
    // Type Checks
    // ---------------------------------------------------------------------------

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    isType(definitionType: Function): boolean {
        // check top-down: definition is only of requested definitionType if it doesn't match any of the more specific types
        for (const type of this.classes) {
            if (this.baseDefinition instanceof type) {
                return type === definitionType;
            }
        }
        return false;
    }


    isTemplate(): boolean {
        return !!this.template;
    }
}
