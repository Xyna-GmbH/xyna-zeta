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
import { environment } from '@environments/environment';

import { XoObject, XoObjectClass, XoProperty } from '../../api';


@XoObjectClass(null, 'xmcp.auth', 'ExternalUserLoginRequest')
export class XoExternalUserLoginRequest extends XoObject {

    @XoProperty()
    domain: string;

    @XoProperty()
    force: boolean;

    @XoProperty()
    path: string;


    static withDomain(domain: string, force = false): XoExternalUserLoginRequest {
        const request = new XoExternalUserLoginRequest();
        request.domain = domain;
        request.force = force;
        request.path = environment.zeta.auth ? environment.zeta.auth.pathToken : '/';
        return request;
    }
}
