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
import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { Comparable, dateTimeString } from '../../base';


export enum XcStatusBarEntryType {
    NONE = '',
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE'
}


export class XcStatusBarEntry extends Comparable {

    constructor(
        readonly message: string,
        readonly type: XcStatusBarEntryType,
        readonly timestamp = +new Date()
    ) {
        super();
    }

    get uniqueKey(): string {
        return '' + this.type + '::' + this.timestamp;
    }

    get time(): string {
        return dateTimeString(this.timestamp);
    }
}


@Injectable()
export class XcStatusBarService {

    private readonly statusBarEntrySubject = new Subject<XcStatusBarEntry>();


    get displayStatusBarEntry(): Observable<XcStatusBarEntry> {
        return this.statusBarEntrySubject.asObservable();
    }


    display(message: string, type = XcStatusBarEntryType.INFO) {
        this.statusBarEntrySubject.next(new XcStatusBarEntry(message, type));
    }
}
