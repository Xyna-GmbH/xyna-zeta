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
import { AfterViewInit, Component, Injector, OnDestroy } from '@angular/core';
import { environment } from '@environments/environment';
import { XcStackItemComponent, XcStackItemComponentData } from '../../../../xc-stack/xc-stack-item/xc-stack-item.component';

import { Observable, of, Subject, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { XoFormDefinition } from '../../xo/containers.model';
import { ApiService, StartOrderOptionsBuilder, Xo, XoXPRCRuntimeContext, XoXPRCRuntimeContextFromRuntimeContext } from '../../../../../api';
import { XcStackItem, XcStackItemInterface, XcStackItemObserver } from '../../../../xc-stack/xc-stack-item/xc-stack-item';
import { XoBaseDefinition, XoCloseDefinitionData, XoDefinitionBundle, XoDefinitionObserver } from '../../xo/base-definition.model';
import { XcDialogService } from '../../../../xc-dialog/xc-dialog.service';
import { I18nService } from '../../../../../i18n';
import { XcComponentTemplate } from '../../../../xc-template/xc-template';
import { XoStartOrderButtonDefinition } from '../../xo/item-definition.model';


export interface DefinitionStackItemComponentData extends XcStackItemComponentData {
    definition: XoFormDefinition;
    data: Xo[];
}


interface DefinitionStackItem {
    item: XcStackItem;
    definition: XoBaseDefinition;
}


@Component({
    templateUrl: './xc-definition-stack-item.component.html',
    styleUrls: ['./xc-definition-stack-item.component.scss']
})
export class XcDefinitionStackItemComponent extends XcStackItemComponent<DefinitionStackItemComponentData> implements XoDefinitionObserver, AfterViewInit, OnDestroy {

    private detailsItem: DefinitionStackItem;
    private readonly closedSubject = new Subject<XoCloseDefinitionData>();
    private readonly subscriptions: Subscription[] = [];


    constructor(readonly injector: Injector, private readonly api: ApiService, private readonly dialogs: XcDialogService, private readonly i18n: I18nService) {
        super(injector);
    }


    ngAfterViewInit() {
        if (this.injectedData.definition) {
            this.subscriptions.push(this.injectedData.definition.getContainerLabel(this.injectedData.data).subscribe(label =>
                this.injectedData.stackItem.setBreadcrumbLabel(label)
            ));
        }
    }


    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }


    // ========================================================================================================================
    // XO DEFINITION OBSERVER
    // ========================================================================================================================

    openDefinition(definition: XoBaseDefinition, data: Xo[]): Observable<XcStackItemInterface> {
        // triggered from somewhere: table-row-selection, open-definition-Button, rich-list-selection, ...
        // opens new stack item with this definition
        // caches stack item to replace it when new definition shall be opened

        const openDetailsItem = (): Observable<XcStackItemInterface> => {
            this.detailsItem = { item: new XcStackItem(), definition: definition };
            this.detailsItem.item.addItemObserver(<XcStackItemObserver>{
                beforeClose: () => this.detailsItem.definition.hasDataChanges()
                    ? this.dialogs.confirm(this.i18n.translate('Confirm Close'), this.i18n.translate('There are unsaved changes. Close anyway and discard changes?')).afterDismiss()
                    : of(true),
                afterClose: () => {
                    this.detailsItem = null;
                }
            });
            this.detailsItem.item.setTemplate(new XcComponentTemplate(
                XcDefinitionStackItemComponent,
                <DefinitionStackItemComponentData>{ stackItem: this.detailsItem.item, definition: definition, data: data }
            ));
            return this.stackItem.stack.open(this.detailsItem.item);
        };

        // close current details item, if any
        if (this.detailsItem && this.detailsItem.definition && this.detailsItem.definition.observer) {
            return this.detailsItem.definition.observer.closeDefinition().pipe(
                switchMap(closed => closed ? openDetailsItem() : of(null))
            );
        }
        return openDetailsItem();
    }


    closeDefinition(data?: XoCloseDefinitionData): Observable<boolean> {
        if (data && data.force && this.injectedData.definition) {
            // force - remove dirty flags
            this.injectedData.definition.clearDataChangeState();
        }
        return this.stackItem.stack.close(this.stackItem).pipe(
            tap(closed => {
                if (closed) {
                    this.closedSubject.next(data);
                    this.closedSubject.complete();
                }
            })
        );
    }


    close(data?: XoCloseDefinitionData) {
        this.closeDefinition(data).subscribe();
    }


    definitionClosed(): Observable<XoCloseDefinitionData> {
        this.dialogs.info('Definition Closed', 'not implemented yet in DefinitionObserver');
        return of();
    }


    resolveDefinition(definitionWorkflowRTC: XoXPRCRuntimeContext, definitionWorkflowFQN: string, data: Xo[]): Observable<XoDefinitionBundle> {
        this.dialogs.info('Resolve Definition from Workflow', 'not implemented yet in DefinitionObserver');
        return of();
    }


    translate(value: string): string {
        return value;
    }


    getDefaultRTC(): XoXPRCRuntimeContext {
        return XoXPRCRuntimeContextFromRuntimeContext(environment.zeta.xo.runtimeContext);
    }


    startOrder(definition: XoStartOrderButtonDefinition, input: Xo | Xo[]): Observable<Xo | Xo[]> {
        const rtc = (definition.serviceRTC ? definition.serviceRTC : this.getDefaultRTC()).toRuntimeContext();
        return this.api.startOrder(
            rtc,
            definition.serviceFQN,
            input, null,
            new StartOrderOptionsBuilder().withErrorMessage(true).async(!definition.synchronously).options
        ).pipe(map(result => result.output));
    }
}
