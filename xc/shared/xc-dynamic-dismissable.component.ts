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
import { Observable, of } from 'rxjs/';
import { filter } from 'rxjs/operators';

import { XcDynamicComponent } from '../shared/xc-dynamic.component';


export abstract class XcDynamicDismissableComponent<R, D> extends XcDynamicComponent<D> {

    abstract dismiss(result?: R): void;
    abstract afterDismiss(): Observable<R>;


    afterDismissResult(expected?: R): Observable<R> {
        return this.afterDismiss().pipe(
            filter(result => expected === undefined
                ? result !== expected
                : result === expected
            )
        );
    }


    beforeDismiss(): Observable<boolean> {
        return of(true);
    }
}
