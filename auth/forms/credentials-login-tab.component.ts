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
import { Component, Injector } from '@angular/core';

import { I18nService } from '@zeta/i18n';

import { XcTabComponent } from '../../xc';
import { LoginComponentData } from '../login/auth-login.component';


@Component({
    templateUrl: './credentials-login.component.html',
    styleUrls: ['./credentials-login.component.scss']
})
export class CredentialsLoginTabComponent extends XcTabComponent<void, LoginComponentData> {

    data: LoginComponentData = {
        username: '',
        password: '',
        onEnter: () => { }
    };

    constructor(injector: Injector, readonly i18n: I18nService) {
        super(injector);
        this.data = this.injectedData;
    }
}
