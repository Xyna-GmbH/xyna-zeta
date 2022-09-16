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
import { ChangeDetectorRef, Component, InjectionToken, Injector, OnDestroy, Optional } from '@angular/core';

import { Observable, Subscription } from 'rxjs';

import { XcDynamicComponent } from '../../shared/xc-dynamic.component';
import { XC_COMPONENT_DATA, XcTemplate } from '../xc-template';
import { XoTemplateDefinedBase } from './template-container-base.model';


@Component({
    selector: 'xc-template-container',
    templateUrl: './xc-template-container.component.html',
    styleUrls: ['./xc-template-container.component.scss']
})
export class XcTemplateContainerComponent extends XcDynamicComponent<XoTemplateDefinedBase> implements OnDestroy {

    private readonly subscription: Subscription;

    constructor(@Optional() injector: Injector, protected readonly cdRef: ChangeDetectorRef) {
        super(injector);

        this.subscription = this.injectedData.getTemplate()?.childTemplatesChange().subscribe(() => {
            cdRef.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    get templates(): Observable<XcTemplate[]> {
        return this.injectedData.getTemplate().getChildTemplates();
    }

    get stylename(): string {
        const template = this.injectedData.getTemplate();
        return template ? template.stylename : '';
    }

    protected getToken(): InjectionToken<string> {
        return XC_COMPONENT_DATA;
    }
}
