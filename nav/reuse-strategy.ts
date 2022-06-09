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
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

import { RouteComponent } from './route.component';


export class RouteComponentReuseStrategy implements RouteReuseStrategy {

    private readonly handles: Map<string, DetachedRouteHandle> = new Map();


    private getComponentRef(detachedRoute: DetachedRouteHandle): any {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        return detachedRoute['componentRef'];
    }


    private getReuseKey(activatedRoute: ActivatedRouteSnapshot): string {
        const routeConfig = activatedRoute.routeConfig;
        if (routeConfig && routeConfig.data && routeConfig.data.reuse) {
            return routeConfig.data.reuse;
        }
        return null;
    }


    shouldDetach(activatedRoute: ActivatedRouteSnapshot): boolean {
        // console.log('shouldDetach: ', activatedRoute.routeConfig);
        const reuseKey = this.getReuseKey(activatedRoute);
        return !!reuseKey;
    }


    store(activatedRoute: ActivatedRouteSnapshot, detachedRoute: DetachedRouteHandle): void {
        // console.log('store: ', activatedRoute.routeConfig);
        const reuseKey = this.getReuseKey(activatedRoute);
        if (reuseKey) {
            this.handles.set(reuseKey, detachedRoute);
            if (detachedRoute) {
                const component = this.getComponentRef(detachedRoute).instance;
                if (component instanceof RouteComponent) {
                    component.onHide();
                }
            }
        }
    }


    shouldAttach(activatedRoute: ActivatedRouteSnapshot): boolean {
        // console.log('shouldAttach: ', activatedRoute.routeConfig);
        const routeConfig = activatedRoute.routeConfig;
        if (routeConfig && routeConfig.data && routeConfig.data.reset) {
            /** @todo consider page reload instead of manually destroying routes (not perfectly clean) */
            this.handles.forEach((value: DetachedRouteHandle) => {
                this.getComponentRef(value).destroy();
            });
            this.handles.clear();
        }
        const reuseKey = this.getReuseKey(activatedRoute);
        const detachedRoute = this.handles.get(reuseKey);
        if (detachedRoute) {
            const component = this.getComponentRef(detachedRoute).instance;
            if (component instanceof RouteComponent && component.initialized) {
                component.onShow();
            }
        }
        return !!detachedRoute;
    }


    retrieve(activatedRoute: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        // console.log('retrieve: ', activatedRoute.routeConfig);
        const reuseKey = this.getReuseKey(activatedRoute);
        return this.handles.get(reuseKey) || null;
    }


    shouldReuseRoute(currentActivatedRoute: ActivatedRouteSnapshot, futureActivatedRoute: ActivatedRouteSnapshot): boolean {
        return currentActivatedRoute.routeConfig === futureActivatedRoute.routeConfig;
    }
}
