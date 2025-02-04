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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { environment } from '@environments/environment';

import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { ApiService, StartOrderOptionsBuilder } from '../../../../../api';
import { RouteComponent } from '../../../../../nav/route.component';
import { XcStackDataSource } from '../../../../xc-stack/xc-stack-data-source';
import { XcStackItem } from '../../../../xc-stack/xc-stack-item/xc-stack-item';
import { XcComponentTemplate } from '../../../../xc-template/xc-template';
import { XoFormDefinition } from '../../xo/containers.model';
import { DefinitionStackItemComponentData, XcDefinitionStackItemComponent } from '../xc-definition-stack-item/xc-definition-stack-item.component';


@Component({
    selector: 'xc-definition-stack-master',
    templateUrl: './xc-definition-stack-master.component.html',
    styleUrls: ['./xc-definition-stack-master.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class XcDefinitionStackMasterComponent extends RouteComponent implements OnDestroy {

    readonly stackDataSource = new XcStackDataSource();
    private readonly subscription: Subscription;

    active = false;


    constructor(api: ApiService, private readonly cdr: ChangeDetectorRef, private readonly route: ActivatedRoute) {
        super();

        route.data.pipe(
            take(1),
            filter(data => data.fqn)
        ).subscribe(data => {
            api.startOrder(
                environment.zeta.xo.runtimeContext,
                data.fqn,
                data.input,
                null,
                StartOrderOptionsBuilder.defaultOptionsWithErrorMessage
            ).subscribe(response => {
                const formDefinition = response.output[0] as XoFormDefinition;
                const detailData = response.output.slice(1);

                // create stack item
                const item = new XcStackItem();
                item.setTemplate(new XcComponentTemplate(
                    XcDefinitionStackItemComponent,
                    <DefinitionStackItemComponentData>{ stackItem: item, definition: formDefinition, data: detailData }
                ));
                this.stackDataSource.add(item);
            });
        });

        this.subscription = this.stackDataSource.stackItemsChange.subscribe(() =>
            cdr.markForCheck()
        );
    }


    ngOnDestroy() {
        this.subscription.unsubscribe();
    }


    defaultTitle(): string {
        return '<unnamed>';
    }


    onShow() {
        super.onShow();

        this.active = true;
        this.cdr.markForCheck();
    }


    onHide() {
        this.active = false;

        /*
         * REMARK
         * For some reason, "detectChanges" instead of "markForCheck" has to be called here
         * to get the active state into the stack
         */
        this.cdr.detectChanges();
    }
}
