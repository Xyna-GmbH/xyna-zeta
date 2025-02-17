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
import { Directive, ElementRef } from '@angular/core';
import { XcUnwrapDirective } from '../../../../shared/xc-unwrap.directive';


/**
 * Unwraps that DOM element with this directive attached to it.
 * Additionally wraps children into dt/dd, if they aren't such
 */
@Directive({
    selector: '[xc-dl-unwrap]',
    standalone: false
})
export class XcDefinitionListUnwrapDirective extends XcUnwrapDirective {

    constructor(readonly element: ElementRef) {
        super(element);
    }


    protected unwrap(element: Element): Element[] {
        const children = super.unwrap(element);

        // check, if after the unwrapping all the unwrapped children are of type <dt>, <dd> or <xc-definition-list-entry>
        // if not, wrap into dt/dd
        children
            .filter((child: ChildNode) => {
                const name = child.nodeName.toLowerCase();
                return name !== 'dt' && name !== 'dd' && name !== 'xc-definition-list-entry';
            })
            .forEach(child => {
                // wrap
                const dt = document.createElement('dt');
                child.parentNode.insertBefore(dt, child);

                const dd = document.createElement('dd');
                child.parentNode.insertBefore(dd, child);

                child.parentNode.removeChild(child);
                dd.appendChild(child);
            });
        return children;
    }
}
