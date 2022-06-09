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
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs/';
import { map } from 'rxjs/operators';

import { XcTemplate } from '../../xc-template/xc-template';
import { XcStackInterface } from '../xc-stack.component';


export interface XcStackObserver {
    afterOpen(stackItem: XcStackItemInterface): void;
    afterClose(stackItem: XcStackItemInterface): void;
    beforeClose(stackItem: XcStackItemInterface): Observable<boolean>;
    setStack(stack: XcStackInterface): void;
}

export interface XcStackItemInterface {
    getTemplate(): XcTemplate;
    getBreadcrumbLabel(): Observable<string>;
}


export interface XcStackItemObserver {
    beforeClose?(): Observable<boolean>;
    afterClose?(): void;
}


export class XcStackItem implements XcStackItemInterface, XcStackObserver {

    private _template: XcTemplate;
    private _stack: XcStackInterface;
    private readonly _breadcrumbLabel = new BehaviorSubject<string>('');

    private readonly itemObservers: XcStackItemObserver[] = [];


    constructor(template?: XcTemplate) {
        if (template) {
            this.setTemplate(template);
        }
    }


    getTemplate(): XcTemplate {
        return this._template;
    }


    setTemplate(value: XcTemplate) {
        this._template = value;
    }


    afterOpen(stackItem: XcStackItemInterface) {
    }


    afterClose(stackItem: XcStackItemInterface) {
        if (stackItem === this) {
            for (const observer of this.itemObservers) {
                observer.afterClose?.();
            }
        }
    }


    beforeClose(stackItem: XcStackItemInterface): Observable<boolean> {
        if (stackItem === this) {
            return combineLatest(this.itemObservers.map(observer => observer.beforeClose ? observer.beforeClose() : of(true))).pipe(
                map(results => results.indexOf(false) < 0)
            );
        }
        return of(true);
    }


    get stack(): XcStackInterface {
        return this._stack;
    }


    setStack(stack: XcStackInterface) {
        this._stack = stack;
    }


    getBreadcrumbLabel(): Observable<string> {
        return this._breadcrumbLabel.asObservable();
    }


    setBreadcrumbLabel(value: string) {
        this._breadcrumbLabel.next(value);
    }


    addItemObserver(observer: XcStackItemObserver) {
        if (this.itemObservers.indexOf(observer) === -1) {
            this.itemObservers.push(observer);
        }
    }
}
