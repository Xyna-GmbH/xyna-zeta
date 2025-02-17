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
import { Component } from '@angular/core';

import { I18nService } from '../i18n';
import { AuthBackgroundComponent } from './background/auth-background.component';
import { authTranslations_deDE } from './locale/auth-translations.de-DE';
import { authTranslations_enUS } from './locale/auth-translations.en-US';


@Component({
    templateUrl: './auth.component.html',
    standalone: false
})
export class AuthComponent {

    static component: any;


    getBackgroundComponentOutlet() {
        return AuthComponent.component || AuthBackgroundComponent;
    }

    constructor(private readonly i18nService: I18nService) {
        this.i18nService.setTranslations('de-DE', authTranslations_deDE);
        this.i18nService.setTranslations('en-US', authTranslations_enUS);
    }
}
