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
import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';


/**
 * <ng-container *xc-var="complexOperation(param0, param1); let resultOfComplexOperation">
 *   {{resultOfComplexOperation}}
 * </ng-container>
 */
@Directive({
    selector: '[xc-var]',
    standalone: false
})
export class XcVarDirective implements OnDestroy {

    context: any = {};

    constructor(private readonly viewContainerRef: ViewContainerRef, private readonly templateRef: TemplateRef<any>) {
    }


    ngOnDestroy() {
        this.viewContainerRef.clear();
    }


    @Input('xc-var')
    set var(context: any) {
        this.context.$implicit = context;
        this.context.xcVar = context;
        this.updateView();
    }


    updateView() {
        this.viewContainerRef.clear();
        this.viewContainerRef.createEmbeddedView(this.templateRef, this.context);
    }
}
