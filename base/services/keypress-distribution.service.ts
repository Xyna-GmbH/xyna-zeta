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
import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs/';

import { OutsideListenerService } from './outside-listener.service';


export enum KeyboardEventType {
    KEY_TYPE_DOWN,
    KEY_TYPE_UP
}


export interface keyBoardObject {
    type: KeyboardEventType;
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    preventDefault: () => void;
    execute: (fn: () => any) => void;
}


@Injectable({providedIn: 'root'})
export abstract class KeyDistributionService {

    private readonly keyEventSubject = new Subject<keyBoardObject>();


    constructor(private readonly outsideListenerService: OutsideListenerService) {
        outsideListenerService.addOutsideListener(<HTMLElement><unknown>window, 'keydown', (e: KeyboardEvent) => this.keyEvent(e, KeyboardEventType.KEY_TYPE_DOWN));
        outsideListenerService.addOutsideListener(<HTMLElement><unknown>window, 'keyup',   (e: KeyboardEvent) => this.keyEvent(e, KeyboardEventType.KEY_TYPE_UP));
    }


    private keyEvent(event: KeyboardEvent, type: KeyboardEventType): void {
        this.keyEventSubject.next({
            type: type,
            key: event.key,
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey,
            preventDefault: () => event.preventDefault(),
            execute: (fn: () => any) => {
                this.outsideListenerService.runInside(fn);
            }
        });
    }


    get keyEvents(): Observable<keyBoardObject> {
        return this.keyEventSubject.asObservable();
    }
}
