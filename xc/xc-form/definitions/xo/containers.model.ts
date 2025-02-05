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
import { ValidatorFn } from '@angular/forms';
import { combineLatest, merge, Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Xo, XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient } from '../../../../api';
import { XoXPRCRuntimeContext } from '../../../../api/xo/runtime-context.model';
import { XoTableColumnArray } from '../../../xc-table/xc-remote-table-data-source';
import { XcTableDataSource } from '../../../xc-table/xc-table-data-source';
import { XoBaseDefinition, XoBaseDefinitionArray, XoDefinition, XoDefinitionObserver } from './base-definition.model';
import { XoTextItemDefinition } from './item-definition.model';
import { XoDefinitionEvent } from '../xc-definition-event.service';


/***********************************************
 * CONTAINER
 **********************************************/

@XoObjectClass(XoBaseDefinition, 'xmcp.forms.datatypes', 'ContainerDefinition')
export class XoContainerDefinition extends XoBaseDefinition {

    @XoProperty(XoBaseDefinitionArray)
    children: XoBaseDefinitionArray = new XoBaseDefinitionArray();

    @XoProperty(XoDefinitionEvent)
    triggerChangeChildren: XoDefinitionEvent;


    protected afterDecode() {
        super.afterDecode();

        if (this.children) {
            this.children.data.forEach(child => child.setParent(this));
        }
    }

    setChildren(children: XoBaseDefinitionArray) {
        this.clearChildren();
        this.children = children;
        if (this.children) {
            this.children.data.forEach(child => child.setParent(this));
        }
    }


    setObserver(value: XoDefinitionObserver) {
        super.setObserver(value);
        this.children.data.forEach(child => child.setObserver(value));
    }


    isHiddenFor(data: Xo[]): boolean {
        let hidden = super.isHiddenFor(data);
        if (!hidden) {
            const visibleChild = this.children.data.find(child => !child.isHiddenFor(data));
            // is hidden if there is no visible child
            hidden = this.hideIfEmpty && !visibleChild;
        }
        return hidden;
    }


    /**
     * @inheritdoc
     */
    getValidators(): ValidatorFn[] {
        const validators = [];
        this.children.data.forEach(childDefinition => validators.push(...childDefinition.getValidators()));
        return validators;
    }


    getContainerLabel(data: Xo[]): Observable<string> {
        return this.translate(this.label);
    }
}


@XoArrayClass(XoContainerDefinition)
export class XoContainerDefinitionArray extends XoArray<XoContainerDefinition> {
}



/***********************************************
 * FORM
 **********************************************/

@XoObjectClass(XoContainerDefinition, 'xmcp.forms.datatypes', 'FormDefinition')
export class XoFormDefinition extends XoContainerDefinition {
}


@XoArrayClass(XoFormDefinition)
export class XoFormDefinitionArray extends XoArray<XoFormDefinition> {
}



/***********************************************
 * DEFINITION LIST
 **********************************************/

@XoObjectClass(XoFormDefinition, 'xmcp.forms.datatypes', 'DefinitionListDefinition')
export class XoDefinitionListDefinition extends XoFormDefinition {
}


@XoArrayClass(XoDefinitionListDefinition)
export class XoDefinitionListDefinitionArray extends XoArray<XoDefinitionListDefinition> {
}



/***********************************************
 * PANEL BOX
 **********************************************/

@XoObjectClass(XoBaseDefinition, 'xmcp.forms.datatypes', 'PanelBoxDefinition')
export class XoPanelBoxDefinition extends XoBaseDefinition {

    @XoProperty(XoFormDefinition)
    leftArea: XoFormDefinition;

    @XoProperty(XoFormDefinition)
    rightArea: XoFormDefinition;


    protected afterDecode() {
        super.afterDecode();

        if (this.leftArea) {
            this.leftArea.setParent(this);
        }
        if (this.rightArea) {
            this.rightArea.setParent(this);
        }

        // assure: Text Items in a panel box must not have labels set
        [
            ...(this.leftArea ? this.leftArea.children.data : []),
            ...(this.rightArea ? this.rightArea.children.data : [])
        ].filter(child => child instanceof XoTextItemDefinition
        ).forEach(item => {
            if (item.label) {
                item.label = '';
            }
        });
    }


    setObserver(value: XoDefinitionObserver) {
        super.setObserver(value);
        this.leftArea?.setObserver(value);
        this.rightArea?.setObserver(value);
    }


    getPanelLabel(data: Xo[]): Observable<string> {
        const labels = [this.label];
        if (this.leftArea) {
            labels.push(this.leftArea.label);
            this.leftArea.children.data.forEach(childDefinition => {
                labels.push(...childDefinition.resolveData(data));
            });
        }
        return combineLatest(labels.map(label => this.translate(label))).pipe(map(translatedLabels =>
            translatedLabels.reduce((panelLabel: string, label: string) =>
                ((panelLabel && label) ? (panelLabel + ' ' + label) : (panelLabel || label))
            )
        ));
    }
}


@XoArrayClass(XoPanelBoxDefinition)
export class XoPanelBoxDefinitionArray extends XoArray<XoPanelBoxDefinition> {
}



/***********************************************
 * PANEL
 **********************************************/

@XoObjectClass(XoFormDefinition, 'xmcp.forms.datatypes', 'FormPanelDefinition')
export class XoFormPanelDefinition extends XoFormDefinition {

    @XoProperty()
    collapsable = false;

    @XoProperty()
    collapsed = false;

    @XoProperty()
    closable = false;

    @XoProperty()
    compact = false;

    @XoProperty(XoDefinitionEvent)
    triggerClose: XoDefinitionEvent;

    @XoProperty(XoPanelBoxDefinition)
    header: XoPanelBoxDefinition;

    @XoProperty(XoPanelBoxDefinition)
    footer: XoPanelBoxDefinition;


    protected afterDecode() {
        super.afterDecode();

        if (this.header) {
            this.header.setParent(this);
        }
        if (this.footer) {
            this.footer.setParent(this);
        }
    }


    setObserver(value: XoDefinitionObserver) {
        super.setObserver(value);
        this.header?.setObserver(value);
        this.footer?.setObserver(value);
    }


    getContainerLabel(data: Xo[]): Observable<string> {
        return merge(super.getContainerLabel(data), this.header?.getPanelLabel(data) ?? of(null)).pipe(
            filter(label => !!label)
        );
    }
}


@XoArrayClass(XoFormPanelDefinition)
export class XoFormPanelDefinitionArray extends XoArray<XoFormPanelDefinition> {
}



/***********************************************
 * TABLE
 **********************************************/

@XoObjectClass(XoFormPanelDefinition, 'xmcp.forms.datatypes', 'TablePanelDefinition')
export class XoTablePanelDefinition extends XoFormPanelDefinition {

    @XoProperty()
    tableWorkflowFQN: string;

    @XoProperty()
    countWorkflowFQN: string;

    @XoProperty(XoXPRCRuntimeContext)
    tableWorkflowRTC: XoXPRCRuntimeContext;

    @XoProperty(XoDefinition)
    detailsDefinitionReference: XoDefinition;

    @XoProperty(XoDefinitionEvent)
    triggerRefresh: XoDefinitionEvent = new XoDefinitionEvent();

    @XoProperty()
    selectionDataPath = '';

    @XoProperty()
    monitoringLevel: number;

    @XoProperty()
    priority: number;

    @XoProperty()
    @XoTransient()
    tableDataSource: XcTableDataSource;


    protected afterDecode() {
        super.afterDecode();

        // assume selection of whole selected object if no selection data path is defined
        if (!this.selectionDataPath) {
            this.selectionDataPath = '%i%';
        }
    }


    // REMARK: Don't set parent to detailsDefinitionReference. Parent-hierarchy stops with Open-Details-Button

    setObserver(value: XoDefinitionObserver) {
        super.setObserver(value);
        if (this.detailsDefinitionReference) {
            this.detailsDefinitionReference.setObserver(value);
        }
    }


    /**
     * @inheritdoc
     */
    getTableDataSource(): XcTableDataSource {
        return this.tableDataSource;
    }
}


@XoArrayClass(XoTablePanelDefinition)
export class XoTablePanelDefinitionArray extends XoArray<XoTablePanelDefinition> {
}



/***********************************************
 * PREDEFINED TABLE (deprecated, see ZETA-177)
 * (This data type is not part of the ZetaFramework-Application and shall be replaced)
 **********************************************/

@XoObjectClass(null, 'xmcp.forms.datatypes', 'ColumnDefinition')
export class XoColumnDefinition extends XoObject {

    @XoProperty()
    name: string;

    @XoProperty()
    path: string;
}

@XoArrayClass(XoColumnDefinition)
export class XoColumnDefinitionArray extends XoArray<XoColumnDefinition> {
}


@XoObjectClass(XoTablePanelDefinition, 'xmcp.forms.datatypes', 'PredefinedTablePanelDefinition')
export class XoPredefinedTablePanelDefinition extends XoTablePanelDefinition {

    @XoProperty(XoColumnDefinitionArray)
    columns: XoColumnDefinitionArray;


    protected afterDecode() {
        super.afterDecode();

        if (!this.columns) {
            this.columns = new XoTableColumnArray();
        }
    }
}


@XoArrayClass(XoPredefinedTablePanelDefinition)
export class XoPredefinedTablePanelDefinitionArray extends XoArray<XoPredefinedTablePanelDefinition> {
}



/***********************************************
 * TREE
 **********************************************/

@XoObjectClass(XoFormPanelDefinition, 'xmcp.forms.datatypes', 'TreePanelDefinition')
export class XoTreePanelDefinition extends XoFormPanelDefinition {


    @XoProperty(XoXPRCRuntimeContext)
    structureRTC: XoXPRCRuntimeContext;


}

@XoArrayClass(XoTreePanelDefinition)
export class XoTreePanelDefinitionArray extends XoArray<XoTreePanelDefinition> {
}

