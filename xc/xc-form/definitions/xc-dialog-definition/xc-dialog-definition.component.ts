/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { Component, Injector } from '@angular/core';
import { ApiService, StartOrderOptionsBuilder, Xo, XoManagedFileID, XoXPRCRuntimeContext, XoXPRCRuntimeContextFromRuntimeContext } from '@zeta/api';
import { I18nService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc/xc-dialog/xc-dialog.component';
import { XoBaseDefinition, XoDefinition, XoDefinitionBundle, XoDefinitionObserver } from '../xo/base-definition.model';
import { Observable, filter, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { XoStartOrderButtonDefinition } from '../xo/item-definition.model';
import { XcDialogService } from '@zeta/xc/xc-dialog/xc-dialog.service';
import { pack } from '@zeta/base';

@Component({
    templateUrl: './xc-dialog-definition.component.html',
    styleUrls: ['./xc-dialog-definition.component.scss'],
    standalone: false
})
export class XcDialogDefinitionComponent extends XcDialogComponent<Xo[], XoDefinitionBundle> implements XoDefinitionObserver {

    header = '';

    constructor(readonly injector: Injector, private readonly api: ApiService, private readonly dialogs: XcDialogService, private readonly i18n: I18nService) {
        super(injector);
        if (this.injectedData.definition instanceof XoBaseDefinition) {
            this.header = this.injectedData.definition.label;
        }
    }

    // ========================================================================================================================
    // XO DEFINITION OBSERVER
    // ========================================================================================================================

    resolveDefinition(definitionWorkflowRTC: XoXPRCRuntimeContext, definitionWorkflowFQN: string, data: Xo[]): Observable<XoDefinitionBundle> {
        return this.api.startOrder(
            definitionWorkflowRTC.toRuntimeContext(),
            definitionWorkflowFQN,
            data, null,
            new StartOrderOptionsBuilder().withErrorMessage(true).options
        ).pipe(
            filter(result => {
                if (result.errorMessage || result.output?.length === 0) {
                    throwError(() => new Error('no definition found'));
                    this.dialogs.error('No definition found in resolved definition-Workflow');
                    return false;
                }
                return true;
            }),
            map(result => <XoDefinitionBundle>{
                definition: result.output[0],
                data: result.output.slice(1)
            })
        );
    }


    translate(value: string): string {
        return value;
    }


    getDefaultRTC(): XoXPRCRuntimeContext {
        return XoXPRCRuntimeContextFromRuntimeContext(environment.zeta.xo.runtimeContext);
    }


    startOrder(definition: XoStartOrderButtonDefinition, input: Xo | Xo[]): Observable<Xo | Xo[]> {
        const packedInput = pack(input);
        let preStartorder: Observable<string[]> = of([]);
        if (definition.encodeDataPath) {
            const encodeDefinition = new XoDefinition();
            encodeDefinition.dataPath = definition.encodeDataPath;
            encodeDefinition.setParent(definition);
            preStartorder = this.api.encode(encodeDefinition.resolveData(packedInput)).pipe(
                filter(encodedValues => encodedValues.length > 0),
                tap(encodedValues => encodeDefinition.resolveAssignData(packedInput, encodedValues))
            );
        }

        const rtc = (definition.serviceRTC ? definition.serviceRTC : this.getDefaultRTC()).toRuntimeContext();
        return preStartorder.pipe(switchMap(() => this.api.startOrder(
            rtc,
            definition.serviceFQN,
            input, null,
            new StartOrderOptionsBuilder().withErrorMessage(true).async(!definition.synchronously).options
        )), map(result => result.output));
    }


    uploadFile?(host?: string): Observable<XoManagedFileID> {
        return this.api.upload(undefined, host);
    }
}
