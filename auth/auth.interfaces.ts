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
export enum H5FilterErrorCodes {
    SESSION_EXISTS = 'XYNA-04049',
    ROLE_NOT_AUTHORIZED_FOR_ACTION = 'XYNA-04051'
}

export interface H5FilterErrorError {
    errorCode: H5FilterErrorCodes | string;
    message: string;
    objects: H5FilterObject[];
}

export interface H5FilterObject {
    key: string;
    value: string;
}

export interface H5FilterError {
    error: { error: H5FilterErrorError };
    headers: any;
    message: string;
    name: string;
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
}
