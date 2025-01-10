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
import { Component, Input, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';

import { ApiService, RuntimeContext } from '../../../../../api';
import { I18nService } from '../../../../../i18n';
import { XcStructureTreeDataSource } from '../../../../xc-tree/xc-structure-tree-data-source';
import { XoTreePanelDefinition } from '../../xo/containers.model';
import { XcFormPanelDefinitionComponent } from '../xc-form-panel-definition/xc-form-panel-definition.component';


@Component({
    selector: 'xc-tree-panel-definition',
    templateUrl: './xc-tree-panel-definition.component.html',
    styleUrls: ['./xc-tree-panel-definition.component.scss']
})
export class XcTreePanelDefinitionComponent extends XcFormPanelDefinitionComponent implements OnDestroy {

    dataSource: XcStructureTreeDataSource;
    private readonly contentChangeSubscription: Subscription;


    constructor(private readonly api: ApiService, private readonly i18n: I18nService) {
        super();
    }


    ngOnDestroy(): void {
        if (this.contentChangeSubscription) {
            this.contentChangeSubscription.unsubscribe();
        }
    }


    @Input('xc-tree-definition')
    set treeDefinition(value: XoTreePanelDefinition) {
        this.definition = value;
    }


    get treeDefinition(): XoTreePanelDefinition {
        return this.definition as XoTreePanelDefinition;
    }


    protected afterUpdate() {
        super.afterUpdate();

        // build up tree
        let rtc: RuntimeContext;
        if (this.treeDefinition.structureRTC) {
            rtc = this.treeDefinition.structureRTC.toRuntimeContext();
        } else if (this.definition.observer && this.definition.observer.getDefaultRTC) {
            rtc = this.definition.observer.getDefaultRTC().toRuntimeContext();
        } else {
            rtc = RuntimeContext.defaultWorkspace;
            console.warn('TreePanelDefinition: No observer defined to retrieve RTC. Using Default Workspace');
        }
        this.dataSource = new XcStructureTreeDataSource(this.api, this.i18n, rtc, this.resolvedData);
        this.dataSource.container.data.push(...this.resolvedData);
        this.dataSource.readonlyMode = this.treeDefinition.disabled;
        this.dataSource.refresh();

        // set data-change-flag as soon as tree-content changes
        if (this.contentChangeSubscription) {
            this.contentChangeSubscription.unsubscribe();
        }
        this.dataSource.contentChange().subscribe(() => this.definition.setDataChanged());
    }
}
