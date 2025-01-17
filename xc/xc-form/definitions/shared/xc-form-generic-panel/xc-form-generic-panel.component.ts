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
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { Xo } from '../../../../../api';
import { XoFormPanelDefinition } from '../../xo/containers.model';
import { XcDefinitionEventService } from '../../xc-definition-event.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'xc-form-generic-panel',
    templateUrl: './xc-form-generic-panel.component.html',
    styleUrls: ['./xc-form-generic-panel.component.scss']
})
export class XcFormGenericPanelComponent {

    private _definition: XoFormPanelDefinition;

    private readonly eventService: XcDefinitionEventService = inject<XcDefinitionEventService>(XcDefinitionEventService);
    private eventSubscription: Subscription;

    toolTip = 'maximize';
    areaValue = false;
    classList: string;

    @Input('xc-definition-data')
    definitionData: Xo[];

    @Output()
    readonly closed = new EventEmitter<void>();


    @Input('xc-definition')
    set definition(value: XoFormPanelDefinition) {
        this._definition = value;
        this.classList = this.definition.style + (this.definition.compact ? ' compact' : '');

        this.eventSubscription?.unsubscribe();
        if (this.definition.closable && this.definition.triggerClose?.eventId) {
            this.eventSubscription = this.eventService.getDefinitionEventPayloadById(this.definition.triggerClose?.eventId).subscribe(
                () => this.closed.emit()
            );
        }
    }


    get definition(): XoFormPanelDefinition {
        return this._definition;
    }


    resize() {
        this.toolTip = this.areaValue ? 'maximize' : 'standard';
        this.areaValue = !this.areaValue;
    }
}
