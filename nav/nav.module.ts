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
import { NgModule } from '@angular/core';
import { I18nModule } from '@zeta/i18n';

import { XcModule } from '@zeta/xc';

import { BrokenComponent } from './broken.component';
import { RuntimeContextSelectionComponent } from './modal/runtime-context-selection/runtime-context-selection.component';
import { RedirectGuard } from './redirect.guard';
import { RightGuard } from './right.guard';


@NgModule({
    imports: [
        XcModule,
        I18nModule
    ],
    declarations: [
        BrokenComponent,
        RuntimeContextSelectionComponent
    ],
    providers: [
        RightGuard,
        RedirectGuard
    ]
})
export class NavModule {
}
