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
import { AfterContentInit, Component, OnInit } from '@angular/core';

import { XcButtonBaseComponent } from './xc-button-base.component';


@Component({
    selector: 'xc-button',
    templateUrl: './xc-button.component.html',
    styleUrls: ['./xc-button-base.component.scss', './xc-button.component.scss']
})
export class XcButtonComponent extends XcButtonBaseComponent implements OnInit, AfterContentInit {

    private _translate: boolean;

    private element: HTMLElement;

    protected setAriaLabel(value: string) {
        super.setAriaLabel(value || (this.elementRef.nativeElement as HTMLElement).innerText);
    }

    ngOnInit() {
        super.ngOnInit();
        this.element = this.elementRef.nativeElement.querySelector('.mat-button-wrapper');
        this._translate = Array.from(this.element.childNodes).some(childNode => childNode.nodeType === Node.TEXT_NODE);
    }

    ngAfterContentInit() {
        super.ngAfterContentInit();

        if (this._translate) {
            if (this.element && this.i18nContext != null) {
                this.element.textContent = this.i18n.translate(this.i18nContext ? this.i18nContext + '.' + this.element.textContent : this.element.textContent);
            }
        }
    }
}
