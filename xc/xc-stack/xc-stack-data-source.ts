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
import { BehaviorSubject, Observable } from 'rxjs/';

import { XcStackItemInterface, XcStackObserver } from './xc-stack-item/xc-stack-item';


export class XcStackDataSource {

    private readonly _stackItemsSubject = new BehaviorSubject<(XcStackItemInterface & XcStackObserver)[]>([]);
    // private readonly _selectedStackItemSubject = new BehaviorSubject<XcStackItemInterface & XcStackObserver>(null);

    get stackItems(): (XcStackItemInterface & XcStackObserver)[] {
        return this._stackItemsSubject.value;
    }

    get stackItemsChange(): Observable<(XcStackItemInterface & XcStackObserver)[]> {
        return this._stackItemsSubject.asObservable();
    }

    // get selectedStackItem(): XcStackItemInterface & XcStackObserver {
    //     return this._selectedStackItemSubject.value;
    // }

    // set selectedStackItem(value: XcStackItemInterface & XcStackObserver) {
    //     this._selectedStackItemSubject.next(value);
    // }

    // get selectedStackItemChange(): Observable<XcStackItemInterface & XcStackObserver> {
    //     return this._selectedStackItemSubject.asObservable();
    // }

    add(stackItem: XcStackItemInterface & XcStackObserver) {
        if (stackItem) {
            this.stackItems.push(stackItem);
            this._stackItemsSubject.next(this.stackItems);
        }
    }

    remove(stackItem: XcStackItemInterface & XcStackObserver) {
        if (stackItem) {
            const idx = this.stackItems.indexOf(stackItem);
            if (idx >= 0) {
                this.stackItems.splice(idx, 1);
                this._stackItemsSubject.next(this.stackItems);
            }
        }
    }

    length(): number {
        return this.stackItems ? this.stackItems.length : 0;
    }

    last(): XcStackItemInterface & XcStackObserver {
        return this.length() > 0 ? this.stackItems[this.length() - 1] : null;
    }
}
