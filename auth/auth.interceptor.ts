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
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private readonly injector: Injector, private readonly router: Router) {
    }


    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        // get auth service via injector instead of automatically via constructor
        // https://github.com/angular/angular/issues/18224#issuecomment-316957213
        const authService = this.injector.get(AuthService);

        // clone request to allow credentials to be sent along with the request
        request = request.clone({withCredentials: true});

        return next.handle(request).pipe(
            catchError((error: any) => {
                if (error instanceof HttpErrorResponse) {
                    // unauthorized
                    if (error.status === 401) {
                        console.log('AuthInterceptor Unauthorized');
                        // the router url contains the correct value when losing a previous authentication, but not when initially acquiring the authentication.
                        // therefore we have to resort to using the browsers location object to obtain the redirect url in that case.
                        let redirectUrl = this.router.url;
                        if (redirectUrl === '/') {
                            redirectUrl = (location.pathname + location.search).substring(1);
                            redirectUrl = redirectUrl.substring(redirectUrl.indexOf('/'));
                        }
                        authService.requireAuthentication(redirectUrl);
                    } else if (error.status === 403) {
                        // forbidden
                        console.log('AuthInterceptor Forbidden');
                    }
                }
                // return the error to the method that called it
                return throwError(error);
            })
        );
    }
}
