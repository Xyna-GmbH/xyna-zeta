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
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


export interface ErrorObject {
    error: HttpErrorResponse;
    message: string;
    exceptionMessage: string;
}

@Injectable()
export class RightsInterceptor implements HttpInterceptor {

    private static readonly _errorSubject = new Subject<ErrorObject>();

    static get errorChange(): Observable<ErrorObject> {
        return this._errorSubject.asObservable();
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req) {
            return next.handle(req).pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 403) {

                        const errorObject: ErrorObject = {
                            error: error,
                            message: 'xfm.insufficient-rights-message',
                            exceptionMessage: error.error.exceptionMessage
                        };

                        RightsInterceptor._errorSubject.next(errorObject);
                    }
                    return throwError(error);
                })
            );
        }
        return next.handle(req);
    }
}
