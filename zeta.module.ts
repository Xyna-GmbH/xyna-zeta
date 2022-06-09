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
import { NgModule } from '@angular/core';

import { A11yModule } from './a11y';
import { ApiModule } from './api';
import { AuthModule } from './auth';
import { BaseModule } from './base/base.module';
import { I18nModule } from './i18n';
import { NavModule } from './nav';
import { XcModule } from './xc';


@NgModule({
    imports: [
        A11yModule,
        ApiModule,
        AuthModule,
        BaseModule,
        I18nModule,
        NavModule,
        XcModule
    ],
    exports: [
        A11yModule,
        ApiModule,
        AuthModule,
        BaseModule,
        I18nModule,
        NavModule,
        XcModule
    ],
    providers: [
    ]
})
export class ZetaModule {
}
