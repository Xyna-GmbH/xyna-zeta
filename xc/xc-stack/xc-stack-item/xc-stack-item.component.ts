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
import { InjectionToken, Injector } from '@angular/core';

import { Observable, of } from 'rxjs/';

import { XcDynamicComponent } from '../../shared/xc-dynamic.component';
import { XC_COMPONENT_DATA } from '../../xc-template/xc-template';
import { XcStackItem, XcStackItemObserver } from './xc-stack-item';


export interface XcStackItemComponentData {
    stackItem: XcStackItem;
}


export class XcStackItemComponent<D extends XcStackItemComponentData = XcStackItemComponentData> extends XcDynamicComponent<D> implements XcStackItemObserver {

    constructor(injector: Injector) {
        super(injector);

        this.stackItem.addItemObserver(this);
    }


    protected getToken(): InjectionToken<XcStackItemComponentData> {
        return XC_COMPONENT_DATA;
    }


    /**
     * Is called when the corresponding stackItem is asked to be closed. Override to do custom operations.
     * @returns TRUE if item can be closed, FALSE otherwise
     */
    beforeClose(): Observable<boolean> {
        return of(true);
    }


    /**
     * Is called when the corresponding stackItem has been closed. Override to do custom operations.
     */
    afterClose() {
    }


    get stackItem(): XcStackItem {
        return this.injectedData.stackItem;
    }
}
