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
import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';


@Injectable()
export class XcIconService {

    constructor(
        private readonly matIconRegistry: MatIconRegistry,
        private readonly domSanitizer: DomSanitizer
    ) {
    }


    /**
     * usage:
     *
     * // import service in root component to add svg icons:
     * iconService.addSvgIcon('mysvg', 'assets/mysvg.svg');
     *
     * // use <xc-icon> or <xc-icon-button> with svg icons:
     * <xc-icon xc-icon-svg xc-icon-name="mysvg"></xc-icon>
     * <xc-icon-button xc-icon-svg xc-icon-name="mysvg"></xc-icon-button>
     */
    addSvgIcon(iconName: string, iconPath: string) {
        this.matIconRegistry.addSvgIcon(iconName, this.domSanitizer.bypassSecurityTrustResourceUrl(iconPath));
    }
}

