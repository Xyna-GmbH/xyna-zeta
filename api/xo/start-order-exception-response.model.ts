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
import { XoStartOrderResponse } from './start-order-response.model';
import { XoArrayClass, XoObjectClass, XoProperty } from './xo-decorators';
import { XoArray } from './xo-object';
import { XoXynaExceptionBaseArray } from './xyna-exception-base.model';


@XoObjectClass(XoStartOrderResponse, 'xmcp.xact.startorder', 'StartOrderExceptionResponse')
export class XoStartOrderExceptionResponse extends XoStartOrderResponse {

    @XoProperty()
    errorMessage: string;

    @XoProperty()
    stackTrace: string[];

    @XoProperty(XoXynaExceptionBaseArray)
    exceptions: XoXynaExceptionBaseArray;
}


@XoArrayClass(XoStartOrderExceptionResponse)
export class XoStartOrderExceptionResponseArray extends XoArray<XoStartOrderExceptionResponse> {
}


// eslint-disable-next-line no-new
new XoStartOrderExceptionResponse();
