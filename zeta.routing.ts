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
import { Title } from '@angular/platform-browser';
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router';

import { ApiRoutes, ApiRoutingModules, ApiRoutingProviders } from './api';
import { AuthRoutes, AuthRoutingModules, AuthRoutingProviders } from './auth';
import { NavRoutes, NavRoutingModules, NavRoutingProviders, RouteComponentReuseStrategy } from './nav';


export const ZetaRoutes: Routes = [
    { path: '', children: ApiRoutes },
    { path: '', children: AuthRoutes },
    { path: '', children: NavRoutes }
];

export const ZetaRoutingModules = [
    RouterModule.forRoot(ZetaRoutes),
    ...ApiRoutingModules,
    ...AuthRoutingModules,
    ...NavRoutingModules
];

export const ZetaRoutingProviders = [
    { provide: RouteReuseStrategy, useClass: RouteComponentReuseStrategy },
    ...ApiRoutingProviders,
    ...AuthRoutingProviders,
    ...NavRoutingProviders,
    Title
];
