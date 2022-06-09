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
import { XoStartOrderResponse } from './start-order-response.model';
import { XoArrayClass, XoObjectClass, XoProperty } from './xo-decorators';
import { Xo, XoArray } from './xo-object';


@XoObjectClass(XoStartOrderResponse, 'xmcp.xact.startorder', 'StartOrderSuccessResponse')
export class XoStartOrderSuccessResponse extends XoStartOrderResponse {

    // for compatibility with original the start order result interface,
    // pretend the output is an array of xo's instead of an XoArray<Anytype>
    @XoProperty()
    output: Xo[];
}


@XoArrayClass(XoStartOrderSuccessResponse)
export class XoStartOrderSuccessResponseArray extends XoArray<XoStartOrderSuccessResponse> {
}


// eslint-disable-next-line no-new
new XoStartOrderSuccessResponse();
