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
import { Injectable, NgZone } from '@angular/core';


type EventHandler = (event: Event) => void;


interface OutsideListenerTriple {
    handler: EventHandler;
    // eslint-disable-next-line no-undef
    element: DocumentAndElementEventHandlers;
    eventType: string;
}


@Injectable()
export class OutsideListenerService {
    private static id = 0;

    private readonly handlerTriples = new Map<number, OutsideListenerTriple>();
    // eslint-disable-next-line no-undef
    private readonly handlerIdArrays = new Map<DocumentAndElementEventHandlers, number[]>();


    constructor(private readonly ngZone: NgZone) {
    }


    // eslint-disable-next-line no-undef
    addOutsideListener(element: DocumentAndElementEventHandlers, eventType: string, listener: EventHandler): number {
        let handler: EventHandler;
        let handlerId: number;
        // add listener outside of angular
        this.ngZone.runOutsideAngular(() => {
            handler = event => listener(event);
            handlerId = ++OutsideListenerService.id;
            element.addEventListener(eventType, handler);
        });
        // add triple to triples map
        this.handlerTriples.set(handlerId, {handler, element, eventType});
        // add handler id array inside arrays map
        (this.handlerIdArrays.get(element) ?? this.handlerIdArrays.set(element, []).get(element)).push(handlerId);
        // handler id is needed to remove listener again
        return handlerId;
    }


    removeOutsideListener(handlerId: number): boolean {
        const triple = this.handlerTriples.get(handlerId);
        if (triple) {
            // remove listener
            triple.element.removeEventListener(triple.eventType, triple.handler);
            // clear maps
            this.handlerTriples.delete(handlerId);
            this.handlerIdArrays.delete(triple.element);
            return true;
        }
        return false;
    }


    // eslint-disable-next-line no-undef
    removeAllOutsideListenerFromElement(element: DocumentAndElementEventHandlers) {
        (this.handlerIdArrays.get(element) ?? []).forEach(id => this.removeOutsideListener(id));
    }


    runInside(fn: (...args: any[]) => any, applyThis?: any, applyArgs?: any[]): any {
        return this.ngZone.run(fn, applyThis, applyArgs);
    }
}
