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
import { I18nTranslation } from '@zeta/i18n';


export const changePassword_translations_en_US: I18nTranslation[] = [
    {
        key: 'zeta.auth.change-password.header',
        value: 'Change Password'
    },
    {
        key: 'zeta.auth.change-password.oldPassword',
        value: 'Old Password'
    },
    {
        key: 'zeta.auth.change-password.newPassword',
        value: 'New Password'
    },
    {
        key: 'zeta.auth.change-password.newPassword.error',
        value: 'Password does not meet the requirements'
    },
    {
        key: 'zeta.auth.change-password.confirmPassword',
        value: 'Confirm Password'
    },
    {
        key: 'zeta.auth.change-password.confirmPassword.error',
        value: 'Passwords do not match'
    },
    {
        key: 'zeta.auth.change-password.hint',
        value: 'The new password must match the following rule: $0'
    },
    {
        key: 'zeta.auth.change-password.error.unauthorized',
        value: 'The old password is incorrect.'
    },
    {
        key: 'zeta.auth.change-password.cancel',
        value: 'Cancel'
    },
    {
        key: 'zeta.auth.change-password.apply',
        value: 'Apply'
    }
];
