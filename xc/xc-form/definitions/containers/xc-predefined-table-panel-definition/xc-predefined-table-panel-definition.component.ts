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

import { Xo, XoArray, XoObject } from '../../../../../api';
import { pack } from '../../../../../base';
import { I18nService } from '../../../../../i18n';
import { XcLocalTableDataSource } from '../../../../xc-table/xc-local-table-data-source';
import { TableCounts, XcTableColumn } from '../../../../xc-table/xc-table-data-source';
import { XoBaseDefinition, XoDefinition } from '../../xo/base-definition.model';
import { XoPredefinedTablePanelDefinition } from '../../xo/containers.model';
import { XcFormPanelDefinitionComponent } from '../xc-form-panel-definition/xc-form-panel-definition.component';


@Component({
    selector: 'xc-predefined-table-panel-definition',
    templateUrl: './xc-predefined-table-panel-definition.component.html',
    styleUrls: ['./xc-predefined-table-panel-definition.component.scss'],
    standalone: false
})
export class XcPredefinedTablePanelDefinitionComponent extends XcFormPanelDefinitionComponent {

    dataSource: XcLocalTableDataSource;
    tableCounts: TableCounts;
    private detailsDefinition: XoDefinition;

    constructor(private readonly i18n: I18nService) {
        super();
    }


    @Input('xc-table-definition')
    set tableDefinition(value: XoPredefinedTablePanelDefinition) {
        this.definition = value;
    }


    get tableDefinition(): XoPredefinedTablePanelDefinition {
        return this.definition as XoPredefinedTablePanelDefinition;
    }


    refresh() {
        this.dataSource.refresh();

        // close details on refresh
        if (this.detailsDefinition && this.detailsDefinition.observer && this.tableDefinition.observer.closeDefinition) {
            this.detailsDefinition.observer.closeDefinition().subscribe();
            this.detailsDefinition = null;
        }
    }


    clearFilters() {
        this.dataSource.resetFilters();
    }


    protected afterUpdate() {
        super.afterUpdate();

        this.dataSource = new XcLocalTableDataSource<XoObject>(this.i18n);
        this.dataSource.limit = 50;
        this.dataSource.localTableData = {
            rows: this.resolvedData.length > 0 && this.resolvedData[0] instanceof XoArray ? (<XoArray> this.resolvedData[0]).data : [],
            columns: this.tableDefinition.columns.data.map(column => <XcTableColumn>{ name: column.name, path: column.path })
        };
        this.dataSource.countChange.subscribe(counts => this.tableCounts = counts);

        // a table-definition has to know its data source
        this.tableDefinition.tableDataSource = this.dataSource;

        this.dataSource.selectionModel.selectionChange.subscribe(model => {
            if (model.selection.length <= 0) {
                return;
            }

            /* Resolve detail-definition-workflow (if defined) with selection as input
             * The output is a new definition and maybe data.
             * This is passed to the definition observer to open the new definition
             */
            if (this.tableDefinition.detailsDefinitionReference) {

                /* The data to pass to the detail definition can consist of the selected entry and the definition data
                 * of this table definition.
                 * To resolve this data, a temporary definition is used to compound the data
                 */
                const compoundDefinition = new XoDefinition();
                compoundDefinition.dataPath = this.tableDefinition.selectionDataPath.replace('%i%', `%${this.definitionData.length}%`);
                compoundDefinition.setParent(this.definition);
                const compoundData = [...this.definitionData, ...(<Xo[]>model.selection)];

                const resolvedData = compoundDefinition.resolveData(compoundData);
                this.tableDefinition.detailsDefinitionReference.resolveDefinition(pack(resolvedData)).subscribe({
                    next: definitionBundle => {
                        // open the resolved definition
                        if (this.tableDefinition.observer && this.tableDefinition.observer.openDefinition && definitionBundle.definition instanceof XoBaseDefinition) {
                            this.detailsDefinition = definitionBundle.definition;
                            this.tableDefinition.observer.openDefinition(definitionBundle.definition, definitionBundle.data).subscribe();
                        }
                    }
                });
            }
        });
        this.dataSource.refresh();
    }
}
