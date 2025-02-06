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

import { pack } from '@zeta/base';

import { Subscription } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { ApiService, XynaMonitoringLevel, XynaPriority } from '../../../../../api';
import { I18nService } from '../../../../../i18n';
import { XcRemoteTableDataSource } from '../../../../xc-table/xc-remote-table-data-source';
import { XoBaseDefinition, XoDefinition } from '../../xo/base-definition.model';
import { XoTablePanelDefinition } from '../../xo/containers.model';
import { XcFormPanelDefinitionComponent } from '../xc-form-panel-definition/xc-form-panel-definition.component';


@Component({
    selector: 'xc-table-panel-definition',
    templateUrl: './xc-table-panel-definition.component.html',
    styleUrls: ['./xc-table-panel-definition.component.scss']
})
export class XcTablePanelDefinitionComponent extends XcFormPanelDefinitionComponent implements OnDestroy {

    dataSource: XcRemoteTableDataSource;
    private detailsDefinition: XoDefinition;

    private readonly subscriptions: Subscription[] = [];
    private refreshEventSubscription: Subscription;

    tableInputFQN = '';

    constructor(private readonly api: ApiService, private readonly i18n: I18nService) {
        super();
    }


    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.refreshEventSubscription?.unsubscribe();
    }


    @Input('xc-table-definition')
    set tableDefinition(value: XoTablePanelDefinition) {
        this.definition = value;
    }


    get tableDefinition(): XoTablePanelDefinition {
        return this.definition as XoTablePanelDefinition;
    }


    refresh(clearSelection?: boolean) {
        if (clearSelection) {
            this.dataSource.selectionModel.clear();
        }
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

        // request table
        const rtc = this.tableDefinition.tableWorkflowRTC
            ? this.tableDefinition.tableWorkflowRTC
            : this.definition.observer ? this.definition.observer.getDefaultRTC() : null;
        if (!rtc) {
            console.error('Table Panel Definition: No RTC for Table-Workflow defined!');
            return;
        }
        this.dataSource = new XcRemoteTableDataSource(this.api, this.i18n,
            rtc.toRuntimeContext(), this.tableDefinition.tableWorkflowFQN);

        this.dataSource.input = this.resolvedData;

        this.tableInputFQN = this.dataSource.input.length > 0 ? this.dataSource.input[0].fqn.encode() : '';

        if (this.tableDefinition.monitoringLevel !== undefined) {
            this.dataSource.monitoringLevel = <XynaMonitoringLevel>(this.tableDefinition.monitoringLevel);
        }
        if (this.tableDefinition.priority !== undefined) {
            this.dataSource.priority = <XynaPriority>(this.tableDefinition.priority);
        }
        this.dataSource.refreshOnFilterChange = false;
        this.dataSource.showFooterLabels = false;
        this.dataSource.totalCountOrderType = this.tableDefinition.countWorkflowFQN;
        this.dataSource.selectionModel.selectionChangeForUnchangedSelection = true;

        this.subscriptions.push(
            this.dataSource.countChange.subscribe(() => this.cdr.detectChanges())
        );

        this.dataSource.error.subscribe(
            result => console.error('XcRemoteTableDataSource error StartOrderResult: ', result),
            error => console.error('XcRemoteTableDataSource error string: ', error)
        );

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
                const compoundData = [...this.definitionData, ...model.selection];

                const resolvedData = compoundDefinition.resolveData(compoundData);
                this.tableDefinition.detailsDefinitionReference.resolveDefinition(pack(resolvedData)).subscribe({
                    next: definitionBundle => {
                        // open the resolved definition
                        if (this.tableDefinition.observer && this.tableDefinition.observer.openDefinition && definitionBundle.definition instanceof XoBaseDefinition) {
                            this.tableDefinition.observer.openDefinition(definitionBundle.definition, definitionBundle.data).subscribe({
                                next: stackItem => {
                                    if (stackItem && definitionBundle.definition) {
                                        this.detailsDefinition = definitionBundle.definition;

                                        // get notified when details close
                                        let observerSubscription: Subscription;
                                        // eslint-disable-next-line prefer-const
                                        observerSubscription = this.detailsDefinition.observerChange
                                            .pipe(filter(observer => !!observer))
                                            .subscribe(observer => {
                                                observer.definitionClosed().pipe(first()).subscribe(data => {
                                                    // refresh table on close of details, if requested
                                                    if (data && data.refreshParentDefinition) {
                                                        this.refresh(!data.reopenAfterRefresh);
                                                    }
                                                    if (observerSubscription) {
                                                        observerSubscription.unsubscribe();
                                                    }
                                                });
                                            });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
        this.dataSource.refresh();

        this.refreshEventSubscription?.unsubscribe();
        if (this.tableDefinition.triggerRefresh?.eventId) {
            this.refreshEventSubscription =
            this.eventService.getDefinitionEventPayloadById(this.tableDefinition.triggerRefresh.eventId)
                .subscribe(() => this.refresh());
        }
    }
}
