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
import { AfterViewInit, Directive, ElementRef } from '@angular/core';


/**
 * Unwraps that DOM element with this directive attached to it
 */
@Directive({
    selector: '[xc-unwrap]'
})
export class XcUnwrapDirective implements AfterViewInit {

    constructor(protected readonly element: ElementRef) {
    }


    ngAfterViewInit() {
        if (this.element.nativeElement as Node) {
            this.unwrap(this.element.nativeElement);
        }
    }


    /**
     * Returns unwrapped children
     */
    protected unwrap(element: Element): Element[] {
        const parent = element.parentElement;
        const children = Array.from(element.children ?? []);

        children.forEach(child =>
            parent?.appendChild(child)
        );

        parent?.removeChild(element);
        return children;
    }
}
