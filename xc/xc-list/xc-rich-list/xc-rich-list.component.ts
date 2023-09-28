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
import { NgComponentOutlet } from '@angular/common';
import { Component, ComponentRef, Injector, Input, QueryList, ViewChildren } from '@angular/core';

import { Subject } from 'rxjs';

import { XcThemeableComponent } from '../../shared/xc-themeable.component';
import { XC_RICH_LIST_ITEM_DATA, XcRichListInterface, XcRichListItem, XcRichListItemComponent, XcRichListItemRef } from './xc-rich-list-item.component';


@Component({
    selector: 'xc-rich-list',
    templateUrl: './xc-rich-list.component.html',
    styleUrls: ['./xc-rich-list.component.scss']
})
export class XcRichListComponent extends XcThemeableComponent implements XcRichListInterface {
    private _componentOutlets: QueryList<NgComponentOutlet>;
    private readonly _componentInjectors = new Map<XcRichListItem, Injector>();
    private readonly _componentSubjects = new Map<XcRichListItem, Subject<XcRichListItemComponent>>();

    @Input('xc-rich-list-items')
    items = new Array<XcRichListItem>();


    constructor(private readonly injector: Injector) {
        super();
    }


    private _getComponentInstance(item: XcRichListItem): XcRichListItemComponent | null {
        const idx = this.items.indexOf(item);
        if (idx >= 0 && idx < this.componentOutlets.length) {
            const componentOutlet = this.componentOutlets.toArray()[idx];
            // necessary private access
            // eslint-disable-next-line @typescript-eslint/dot-notation
            const componentRef = componentOutlet['_componentRef'] as ComponentRef<XcRichListItemComponent>;
            return componentRef.instance;
        }
        return null;
    }


    @ViewChildren(NgComponentOutlet)
    set componentOutlets(value: QueryList<NgComponentOutlet>) {
        const completeItems = new Array<XcRichListItem>();
        let instance: XcRichListItemComponent;
        this._componentOutlets = value;
        this._componentSubjects.forEach((subject, item) => {
            if ((instance = this._getComponentInstance(item))) {
                // notify getComponentInstance() observers
                subject.next(instance);
                subject.complete();
                // remember item with complete subject
                completeItems.push(item);
            }
        });
        // remove all items with complete subjects from map
        completeItems.forEach(item => this._componentSubjects.delete(item));
    }


    get componentOutlets(): QueryList<NgComponentOutlet> {
        return this._componentOutlets;
    }


    getComponent(item: XcRichListItem): ComponentType<XcRichListItemComponent<any, any>> {
        return item.component;
    }


    getComponentInjector(item: XcRichListItem): Injector {
        return this._componentInjectors.get(item) || this._componentInjectors.set(
            item, Injector.create({
                providers: [
                    { provide: XC_RICH_LIST_ITEM_DATA, useValue: item.data },
                    { provide: XcRichListItemRef, useValue: new XcRichListItemRef(this, item) }
                ],
                parent: this.injector
            })
        ).get(item);
    }


    remove(item: XcRichListItem) {
        // remove injector and notify result
        this._componentInjectors.delete(item);
        // remove and complete subject, if any
        const subject = this._componentSubjects.get(item);
        if (subject) {
            subject.complete();
            this._componentSubjects.delete(item);
        }
        // remove from items array
        const index = this.items.indexOf(item);
        this.items.splice(index, 1);
    }
}
