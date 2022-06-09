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

import { XcI18nContextDirective, XcI18nTranslateDirective } from './i18n.directive';
import { I18nPipe, XcI18nPipe } from './i18n.pipe';
import { I18nService } from './i18n.service';


@NgModule({
    declarations: [
        I18nPipe,
        XcI18nPipe,
        XcI18nContextDirective,
        XcI18nTranslateDirective
    ],
    providers: [
        I18nService
    ],
    exports: [
        I18nPipe,
        XcI18nPipe,
        XcI18nContextDirective,
        XcI18nTranslateDirective
    ]
})
export class I18nModule {
}
