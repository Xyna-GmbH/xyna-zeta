/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnDestroy, ViewChild } from '@angular/core';

import { RuntimeContext } from '@zeta/api';
import { Subscription } from 'rxjs/';

import { map, tap } from 'rxjs/operators';

import { ApiService, RuntimeContextSelectionSettings } from '../../../api/api.service';
import { XoApplication, XoApplicationArray, XoWorkspace, XoWorkspaceArray } from '../../../api/xo/xo-runtime-context';
import { I18nService } from '../../../i18n';
import { XcOptionItem } from '../../../xc/shared/xc-item';
import { XcDialogComponent } from '../../../xc/xc-dialog/xc-dialog.component';
import { XcAutocompleteDataWrapper, XcFormAutocompleteComponent } from '../../../xc/xc-form/xc-form-autocomplete/xc-form-autocomplete.component';
import { runtimeContextSelection_translations_de_DE } from './locale/runtime-context-selection-translations.de-DE';
import { runtimeContextSelection_translations_en_US } from './locale/runtime-context-selection-translations.en-US';


@Component({
    templateUrl: './runtime-context-selection.component.html',
    styleUrls: ['./runtime-context-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuntimeContextSelectionComponent extends XcDialogComponent<RuntimeContext, RuntimeContextSelectionSettings> implements OnDestroy {

    private runtimeContext: RuntimeContext;
    private readonly settings: RuntimeContextSelectionSettings;
    private subscription: Subscription;


    runtimeContextDataWrapper = new XcAutocompleteDataWrapper(
        ()    => this.runtimeContext,
        value => this.runtimeContext = value
    );


    constructor(injector: Injector, private readonly apiService: ApiService, private readonly i18n: I18nService, private readonly cdr: ChangeDetectorRef) {
        super(injector);

        this.i18n.setTranslations(I18nService.DE_DE, runtimeContextSelection_translations_de_DE);
        this.i18n.setTranslations(I18nService.EN_US, runtimeContextSelection_translations_en_US);

        this.settings = this.injectedData || {
            setRuntimeContext: true,
            showWorkspaces: true,
            showApplications: false
        };
        this.settings.preselectedRuntimeContext = this.settings.preselectedRuntimeContext || this.apiService.runtimeContext;

        // necessary to include these classes in a release build (see OP-2949)
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const a  = new XoApplication();
        const aa = new XoApplicationArray();
        const w  = new XoWorkspace();
        const wa = new XoWorkspaceArray();
        /* eslint-enable @typescript-eslint/no-unused-vars */

        this.refresh(true);
    }


    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }


    @ViewChild('rtcAutocomplete', {static: false, read: XcFormAutocompleteComponent})
    set rtcAutocomplete(value: XcFormAutocompleteComponent) {
        this.subscription = value?.focus.subscribe(() => this.refresh());
    }


    refresh(restorePreselection = false) {
        this.apiService.getRuntimeContexts().pipe(
            // convert to ordinary runtime context
            map(rtcs => rtcs.map(rtc => rtc.toRuntimeContext())),
            // filter out workspaces or applications
            map(rtcs => rtcs.filter(rtc => rtc.ws && this.settings.showWorkspaces || rtc.av && this.settings.showApplications)),
            // preselect injected runtime context
            tap(rtcs => {
                if (restorePreselection) {
                    this.runtimeContext = rtcs.find(rtc => rtc.equals(this.settings.preselectedRuntimeContext));
                }
            }),
            // convert remaining runtime contexts to option items
            map(rtcs => rtcs.map(rtc => <XcOptionItem>{name: rtc.uniqueKey.replace(RuntimeContext.SEPARATOR, ' '), value: rtc}))
        ).subscribe(options => {
            this.runtimeContextDataWrapper.values = options;
            this.cdr.markForCheck();
        });
    }


    select() {
        if (this.settings.setRuntimeContext) {
            this.apiService.runtimeContext = this.runtimeContext;
        }
        this.dismiss(this.runtimeContext);
    }


    onEnter() {
        if (this.valid) {
            this.select();
        }
    }


    get valid(): boolean {
        return !!this.runtimeContext;
    }
}
