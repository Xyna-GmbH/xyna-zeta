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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { I18nModule } from '@zeta/i18n';

import { XcModule } from '../xc';
import { AuthEventService } from './auth-event.service';
import { AuthComponent } from './auth.component';
import { AuthService } from './auth.service';
import { AuthBackgroundComponent } from './background/auth-background.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { CredentialsLoginTabComponent } from './forms/credentials-login-tab.component';
import { CredentialsLoginComponent } from './forms/credentials-login.component';
import { SmartCardLoginTabComponent } from './forms/smart-card-login-tab.component';
import { SmartCardLoginComponent } from './forms/smart-card-login.component';
import { AuthLoginComponent } from './login/auth-login.component';


@NgModule({
    imports: [
        CommonModule,
        XcModule,
        I18nModule
    ],
    declarations: [
        AuthComponent,
        AuthBackgroundComponent,
        AuthLoginComponent,
        ChangePasswordDialogComponent,
        CredentialsLoginComponent,
        CredentialsLoginTabComponent,
        SmartCardLoginComponent,
        SmartCardLoginTabComponent
    ],
    providers: [
        AuthService,
        AuthEventService
    ],
    exports: [
        AuthLoginComponent
    ]
})
export class AuthModule {
}
