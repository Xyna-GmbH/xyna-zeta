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
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { pack } from '../../../../../base';

import { Xo } from '../../../../../api';
import { XoBaseDefinition, XoCloseDefinitionData, XoDefinition, XoDefinitionObserver, XoDefinitionWorkflow } from '../../xo/base-definition.model';
import { XoDefinitionListDefinition, XoFormDefinition, XoFormPanelDefinition, XoPanelBoxDefinition, XoTablePanelDefinition, XoTreePanelDefinition } from '../../xo/containers.model';
import { XoButtonDefinition, XoCheckboxDefinition, XoComponentDefinition, XoDefinitionListEntryDefinition, XoDropdownDefinition, XoItemDefinition, XoOpenDetailsButtonDefinition, XoOpenDialogButtonDefinition, XoPossibleValuesDefinition, XoStartOrderButtonDefinition, XoTextAreaDefinition, XoTextInputDefinition, XoTextItemDefinition } from '../../xo/item-definition.model';


@Component({
    template: '',
    styleUrls: ['./xc-base-definition.component.scss'],
    standalone: false
})
export class XcBaseDefinitionComponent {

    private _definition: XoBaseDefinition;

    /**
     * Complex objects (e. g. Data-Outputs of a Definition Workflow). Data to show must be resolved via definition.dataPath
     */
    private _definitionData: Xo[];
    private _definitionObserver: XoDefinitionObserver;

    /**
     * Resolved data for all data paths - must be a complex object
     */
    resolvedData: Xo[];
    hidden = false;

    @Output('xc-definition-closed')
    readonly closed = new EventEmitter<XoCloseDefinitionData>();


    constructor() {
        // create dummy-instances such that files with definitions won't be pruned during release-build
         
        const baseDefinition = new XoBaseDefinition();
        const buttonDefinition = new XoButtonDefinition();
        const checkboxDefinition = new XoCheckboxDefinition();
        const componentDefinition = new XoComponentDefinition();
        const definition = new XoDefinition();
        const dropdown = new XoDropdownDefinition();
        const itemDefinition = new XoItemDefinition();
        const openDetailsButtonDefinition = new XoOpenDetailsButtonDefinition();
        const openDialogButtonDefinition = new XoOpenDialogButtonDefinition();
        const possibleValues = new XoPossibleValuesDefinition();
        const startOrderButtonDefinition = new XoStartOrderButtonDefinition();
        const textAreaDefinition = new XoTextAreaDefinition();
        const textInputDefinition = new XoTextInputDefinition();
        const textItemDefinition = new XoTextItemDefinition();
        const definitionListEntry = new XoDefinitionListEntryDefinition();

        const formDefinition = new XoFormDefinition();
        const panelDefinition = new XoFormPanelDefinition();
        const panelBoxDefinition = new XoPanelBoxDefinition();
        const tableDefinition = new XoTablePanelDefinition();
        const treeDefinition = new XoTreePanelDefinition();
        const definitionListDefinition = new XoDefinitionListDefinition();

        const definitionWorkflow = new XoDefinitionWorkflow();
         
    }


    protected get definition(): XoBaseDefinition {
        return this._definition;
    }


    protected set definition(value: XoBaseDefinition) {
        this._definition = value;
        if (this.definition && this.definitionObserver) {
            this.definition.setObserver(this.definitionObserver);
        }
        this._afterUpdate();
    }


    @Input('xc-base-definition-data')
    set definitionDataUnpacked(value: Xo[] | Xo) {
        this._definitionData = pack(value);
        this._afterUpdate();
    }


    get definitionData(): Xo[] {
        return this._definitionData;
    }


    @Input('xc-definition-observer')
    set definitionObserver(value: XoDefinitionObserver) {
        this._definitionObserver = value;
        if (this.definition) {
            this.definition.setObserver(this.definitionObserver);
        }
    }


    get definitionObserver(): XoDefinitionObserver {
        return this._definitionObserver;
    }


    private _afterUpdate() {
        if (this.definition && this.definitionData) {
            this.resolvedData = this.definition.resolveData(this.definitionData);
            this.hidden = this.definition.isHiddenFor(this.definitionData);
            this.afterUpdate();
        }
    }


    /**
     * Override to do things after update of definition or data
     * Is only called if both definition and data are defined
     */
    protected afterUpdate() {
    }
}
