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
import { AfterViewInit, Directive, Host, Optional } from '@angular/core';
import { ValidatorFn } from '@angular/forms';

import { XcFormBaseComponent } from './xc-form-base.component';


@Directive()
export abstract class XcFormValidatorBaseDirective implements AfterViewInit {

    constructor(@Optional() @Host() public host: XcFormBaseComponent) {
    }

    ngAfterViewInit() {
        if (this.host) {
            this.getValidatorFns().forEach(value => this.host.addValidator(value));
        }
    }

    abstract getValidatorFns(): ValidatorFn[];
}
