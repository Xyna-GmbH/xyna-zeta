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
import { Component, Injectable, InjectionToken } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate, Router, RouterStateSnapshot } from '@angular/router';

import { XynaRoute } from './';


export const RedirectGuardConfigToken = new InjectionToken<string>('RedirectGuardConfigToken');


@Injectable()
export class RedirectGuard implements CanActivate, CanDeactivate<Component> {

    /**
     * maps the last visited url to a unique project key
     */
    relativeRedirectUrlMap = new Map<string, string>();
    /**
     * maps the param of the last visited url to a unique project key
     * note: param != queryParam
     *   param => url + '/' + param
     *   queryParam => url + '?' key '=' value (of queryParam)
     */
    relativeRedirectUrlParamsMap = new Map<string, string>();

    constructor(private readonly router: Router) {
    }


    canActivate(activatedRoute: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): boolean {
        const data = (activatedRoute as XynaRoute).data;

        if (!data.redirectDefault) {
            console.error('No redirectDefault is set in the RedirectComponent route');
        }

        if (!data.redirectKey) {
            console.warn('No redirectKey is set in the XynaRouteData of the RedirectComponent route.\nDefault key is used');
            data.redirectKey = 'default';
        }

        const key = data.redirectKey;

        const relativeRedirect = !this.relativeRedirectUrlMap.has(key);

        const relativeRedirectUrl = relativeRedirect
            ? this.relativeRedirectUrlMap.set(key, data.redirectDefault).get(key)
            : this.relativeRedirectUrlMap.get(key);

        const url = relativeRedirect
            ? routerState.url + '/' + relativeRedirectUrl
            : relativeRedirectUrl;

        const param = this.relativeRedirectUrlParamsMap.has(key) ? this.relativeRedirectUrlParamsMap.get(key) : '';

        // navigating in steps seems to restore the highlighting of the navigation items even
        // if there are params
        void this.router.navigateByUrl(url).then(result => {
            if (result && param) {
                void this.router.navigateByUrl(url + param);
            }
        });
        return true;
    }


    canDeactivate(component: Component, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): boolean {
        const data = (currentRoute as XynaRoute).data;

        if (!data.redirectKey) {
            console.warn('No redirectKey is set in the XynaRouteData of this route.\nDefault key is used');
            data.redirectKey = 'default';
        }

        const key = data.redirectKey;

        // in later canActivate: this.router cannot differentiate between url with param or without
        // so we have to cut them out of the url and save them seperately
        const keyArr = Object.keys(currentRoute.params || {});
        const param = currentRoute.params[keyArr[0]] || '';
        this.relativeRedirectUrlParamsMap.set(key, param);

        const url = currentState.url.replace(param, '');

        this.relativeRedirectUrlMap.set(key, url);

        return true;
    }
}


export function RedirectGuardFactory(router: Router, defaultRedirectUrl: string) {
    return new RedirectGuard(router /*, defaultRedirectUrl*/);
}


export function RedirectGuardProvider() {
    return { provide: RedirectGuard, useFactory: RedirectGuardFactory, deps: [Router, RedirectGuardConfigToken] };
}


export function RedirectGuardConfigProvider(defaultRedirectUrl: string) {
    return { provide: RedirectGuardConfigToken, useValue: defaultRedirectUrl };
}


export class RedirectComponent {}
