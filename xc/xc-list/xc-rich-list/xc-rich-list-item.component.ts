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
import { ComponentType } from '@angular/cdk/portal';
import { InjectionToken, Injector, Optional } from '@angular/core';

import { Observable } from 'rxjs';

import { XcDynamicDismissableComponent } from '../../shared/xc-dynamic-dismissable.component';
import { XcItem } from '../../shared/xc-item';


/** Injection token that can be used to access the data that was passed in to a rich list item. */
export const XC_RICH_LIST_ITEM_DATA = new InjectionToken<any>('XcRichListItemData');


export interface XcRichListItem<D = any> extends XcItem {
    component: ComponentType<XcRichListItemComponent<any, any>>;
    // editable?: boolean;
    removable?: boolean;
    selectable?: boolean;
    data?: D;
}


export interface XcRichListInterface {
    remove(item: XcRichListItem): void;
}


export class XcRichListItemRef {

    constructor(readonly richList: XcRichListInterface, readonly item: XcRichListItem) {
    }

    remove() {
        this.richList.remove(this.item);
    }
}


export abstract class XcRichListItemComponent<R = void, D = void> extends XcDynamicDismissableComponent<R, D> {

    private readonly richListItemRef: XcRichListItemRef;


    constructor(@Optional() readonly injector: Injector) {
        super(injector);
        this.richListItemRef = injector.get<XcRichListItemRef>(XcRichListItemRef);
    }


    protected getToken(): InjectionToken<D> {
        return XC_RICH_LIST_ITEM_DATA;
    }


    dismiss(result?: R) {
        this.richListItemRef.remove();
    }


    afterDismiss(): Observable<R> {
        // not yet supported
        return null;
    }
}
