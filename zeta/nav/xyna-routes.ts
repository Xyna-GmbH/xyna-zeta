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
import { Route } from '@angular/router';


export interface XynaRouteData {
    /**
     * the unique key to identify all xyna routes of a single project. Used by the RedirectGuard to identify a project
     */
    redirectKey?: string;
    /**
     * the path of the default route, to which the RedirectGuard is supposed to redirect if no relativeRedirectUrl (of the Guard)
     * is set.
     */
    redirectDefault?: string;
    /**
     * If the reuse strategy should be applied, this must be a string to uniquely identify this route.
     * Not just among the routes of the project, but within all routes of the GUI
     */
    reuse?: string;
    /**
     * the name of the right, which the RightGuard uses to deceide if the link is allowed to be activated for the user
     */
    right?: string;
    /**
     * custom key-value pairs can be set
     */
    [key: string]: any;
    /**
     * name of the document title that is displayed in the tab header
     */
    title?: string;
}

export interface XynaRoute extends Route {
    data?: XynaRouteData;
    children?: XynaRoutes;
}

export declare type XynaRoutes = XynaRoute[];
