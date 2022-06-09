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
import { XoArrayClass, XoObjectClass, XoProperty } from './xo-decorators';
import { XoArray, XoObject } from './xo-object';



@XoObjectClass(null, 'xprc.xpce', 'OrderId')
export class XoOrderId extends XoObject {

    @XoProperty()
    orderId: number;


    static withId(orderId: number): XoOrderId {
        const result = new XoOrderId();
        result.orderId = orderId;
        return result;
    }
}


@XoArrayClass(XoOrderId)
export class XoOrderIdArray extends XoArray<XoOrderId> {

    static withIds(orderIds: number[]): XoOrderIdArray {
        return new XoOrderIdArray().append(...orderIds.map(id => XoOrderId.withId(id)));
    }
}
