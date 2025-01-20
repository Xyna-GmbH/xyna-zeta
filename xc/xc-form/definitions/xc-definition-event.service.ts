/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2025 Xyna GmbH, Germany
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
import { Xo, XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';
import { pack } from '@zeta/base';
import { filter, map, Observable, Subject } from 'rxjs';

interface DefinitionEvent {
    eventId: string;
    payload: Xo[];
}

@XoObjectClass(null, 'xmcp.forms.datatypes', 'DefinitionEvent')
export class XoDefinitionEvent extends XoObject {


    @XoProperty()
    eventId: string;


}

@XoArrayClass(XoDefinitionEvent)
export class XoDefinitionEventArray extends XoArray<XoDefinitionEvent> {
}


@Injectable()
export class XcDefinitionEventService {

    private readonly eventSubject: Subject<DefinitionEvent> = new Subject<DefinitionEvent>();

    static eventService: XcDefinitionEventService;

    constructor() {
        XcDefinitionEventService.eventService = this;
    }

    triggerEventById(eventId: string | string[], payload?: Xo | Xo[]) {
        const eventIds: string[] = pack(eventId);
        eventIds.forEach(id =>
            this.eventSubject.next({eventId: id, payload: pack(payload)})
        );
    }

    getDefinitionEventPayloadById(eventId: string): Observable<Xo[]> {
        return this.eventSubject.asObservable().pipe(
            filter(event => eventId === event.eventId),
            map(event => event.payload)
        );
    }
}
