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
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { isString } from '../../base';


@Directive({
    selector: '[xc-has-right]'
})
export class XcHasRightDirective {

    constructor(
        private readonly authService: AuthService,
        private readonly viewContainerRef: ViewContainerRef,
        private readonly templateRef: TemplateRef<any>
    ) {}


    @Input('xc-has-right')
    set neededRights(value: string) {

        const rightsArray = (isString(value) ? value.split(',') : [])
            .map(item => item.trim()) // trims trailing whitespaces
            .filter(right => right);  // filters out empty elements

        const hide = rightsArray.some(
            right => !this.authService.hasRight(right)
        );

        if (hide) {
            this.viewContainerRef.clear();
        } else {
            this.viewContainerRef.createEmbeddedView(this.templateRef);
        }
    }
}
