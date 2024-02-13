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

import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../auth';
import { XynaRoute } from './xyna-routes';


@Injectable()
export class RightGuardService {

    constructor(private readonly authService: AuthService, private readonly router: Router) {
    }

    canActivate(activatedRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const data = (activatedRoute as XynaRoute).data;
        const right = data.right;

        if (!right) {
            console.error('The right, guarding the route "' + activatedRoute.toString() + '", could not be identified and therefore routing was not allowed.');
            return false;
        }

        const allow = this.authService.hasRight(right);

        if (!allow) {
            const paths = activatedRoute.parent ? activatedRoute.parent : activatedRoute.pathFromRoot[0];
            let url: string;
            let i: number;
            let jumpTo: XynaRoute;
            const children = paths.routeConfig.children.filter(parent => parent.path !== '');

            for (i = 0; i < children.length; i++) {
                if (children[i] === activatedRoute.routeConfig) {
                    jumpTo = children[i + 1];
                    url = this.createURL(activatedRoute, jumpTo);
                    break;
                }
            }
            if (url) {
                void this.router.navigateByUrl(url);
            }
        }

        return allow;
    }

    createURL(activatedRoute: ActivatedRouteSnapshot, jumpTo: XynaRoute): string {
        let url = '';

        if (jumpTo) {
            const activatedDirectoryPath = activatedRoute.url.join('/');
            for (const item of activatedRoute.pathFromRoot) {
                const directoryPath = item.url.join('/');
                if (directoryPath !== activatedDirectoryPath && directoryPath) {
                    url += directoryPath + '/';
                }
            }

            url += jumpTo && jumpTo.path ? jumpTo.path : '' || jumpTo && jumpTo.redirectTo ? jumpTo.redirectTo : '';
        } else {
            url = '/';
        }

        return url;
    }
}

export const rightGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => inject(RightGuardService).canActivate(route, state);
