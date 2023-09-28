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
import { Directive, ElementRef, Input, OnInit } from '@angular/core';


export interface XcMasterDetailFocusCandidateObserver {
    /**
     * An optional function, which emits, based on the original html element,
     * another html element that will be focused instead.
     */
    delegateFocus?: (candidate: HTMLElement) => HTMLElement;
    /**
     * This optional function will be called after the focussing and will
     * be parameterized with the element, on which it actually focused.
     */
    afterFocus?: (focusedElement: HTMLElement) => void;
}


@Directive({
    selector: '[xc-master-detail-focus-candidate]'
})
export class XcMasterDetailFocusCandidateDirective implements OnInit {

    // the preexisting value of the referee should not cause the directive to focus on the element
    private _beforeInit = false;

    @Input('xc-master-detail-focus-candidate')
    moment: 'close' | 'open' | 'none' = 'none';

    @Input('xc-master-detail-focus-candidate-observer')
    observer: XcMasterDetailFocusCandidateObserver;

    @Input('xc-master-detail-focus-candidate-valuereferee')
    set valueReferee(value: any) {
        if (this._beforeInit && !!value) {
            this.focus();
        }
    }

    constructor(private readonly elementRef: ElementRef) {}

    ngOnInit() {
        // the referee is now allowed to be active
        this._beforeInit = true;
    }

    focus() {
        let element: HTMLElement;

        if (this.elementRef) {
            element = this.elementRef.nativeElement;
            if (element) {
                element = this.observer && this.observer.delegateFocus ? this.observer.delegateFocus(element) : element;
                if (element.focus) {
                    const tabIndexBackup = element.tabIndex;
                    element.tabIndex = 0;
                    element.focus();
                    element.tabIndex = tabIndexBackup;

                    if (this.observer && this.observer.afterFocus) {
                        this.observer.afterFocus(element);
                    }
                }
            }
        }
    }

}
