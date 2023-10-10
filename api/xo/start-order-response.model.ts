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
import { XoArrayClass, XoObjectClass, XoProperty } from './xo-decorators';
import { Xo, XoArray, XoJson, XoObject } from './xo-object';
import { XoXynaExceptionBaseArray } from './xyna-exception-base.model';


export interface StartOrderResult<T extends Xo | XoJson = Xo> {
    orderId: string;
    output?: T[];
    // on error
    errorMessage?: string;
    stackTrace?: string[];
    exceptions?: XoXynaExceptionBaseArray;
}


@XoObjectClass(null, 'xmcp.xact.startorder', 'StartOrderResponse')
export class XoStartOrderResponse extends XoObject implements StartOrderResult {

    @XoProperty()
    orderId: string;
}


@XoArrayClass(XoStartOrderResponse)
export class XoStartOrderResponseArray extends XoArray<XoStartOrderResponse> {
}
