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
import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges } from '@angular/core';

import { coerceBoolean } from '../../base';


// https://github.com/mazdik/ng-modal
export interface XcDragOptions {
    dragX?: boolean;
    dragY?: boolean;
    dragInViewport?: boolean;
}


@Directive({
    selector: '[xc-drag]'
})
export class XcDragDirective implements OnChanges, OnDestroy {

    @Input('xc-drag')
    enabled = true;

    @Input('xc-drag-event-target')
    dragEventTarget: MouseEvent | TouchEvent;

    private _dragOptions: XcDragOptions = {};

    @Input('xc-drag-options')
    set dragOptions(value: XcDragOptions) {
        this._dragOptions.dragX = coerceBoolean(value?.dragX) || true;
        this._dragOptions.dragY = coerceBoolean(value?.dragY) || true;
        this._dragOptions.dragInViewport = coerceBoolean(value?.dragInViewport) || true;
    }

    get dragOptions(): XcDragOptions {
        return this._dragOptions;
    }

    @Output() readonly dragStart: EventEmitter<any> = new EventEmitter();
    @Output() readonly dragMove: EventEmitter<any> = new EventEmitter();
    @Output() readonly dragEnd: EventEmitter<any> = new EventEmitter();

    isDragging: boolean;
    lastPageX: number;
    lastPageY: number;
    private readonly globalListeners = new Map<string, {
        handler: (event: Event) => void;
        options?: AddEventListenerOptions | boolean;
    }>();
    private elementWidth: number;
    private elementHeight: number;
    private vw: number;
    private vh: number;

    constructor(private readonly element: ElementRef, private readonly ngZone: NgZone, protected readonly renderer: Renderer2) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.dragEventTarget && changes.dragEventTarget.currentValue && this.enabled) {
            this.onMousedown(this.dragEventTarget);
        }
    }

    ngOnDestroy() {
        this.removeEventListener();
    }

    onMousedown(event: MouseEvent | TouchEvent) {
        if (this.dragOptions.dragX || this.dragOptions.dragY) {
            const evt = this.getEvent(event);
            this.initDrag(evt.pageX, evt.pageY);
            this.addEventListeners(event);
            this.dragStart.emit(event);
        }
    }

    onMousemove(event: MouseEvent | TouchEvent) {
        const evt = this.getEvent(event);
        this.onDrag(evt.pageX, evt.pageY);
        this.dragMove.emit(event);
    }

    onMouseup(event: MouseEvent | TouchEvent) {
        this.endDrag();
        this.removeEventListener();
        this.dragEnd.emit(event);
    }

    addEventListeners(event: MouseEvent | TouchEvent) {
        const isTouchEvent = event.type.startsWith('touch');
        const moveEvent = isTouchEvent ? 'touchmove' : 'mousemove';
        const upEvent = isTouchEvent ? 'touchend' : 'mouseup';

        this.globalListeners
            .set(moveEvent, {
                handler: this.onMousemove.bind(this),
                options: false
            })
            .set(upEvent, {
                handler: this.onMouseup.bind(this),
                options: false
            });

        this.ngZone.runOutsideAngular(() => {
            this.globalListeners.forEach((config, name) => {
                window.document.addEventListener(name, config.handler, config.options);
            });
        });
    }

    removeEventListener() {
        this.globalListeners.forEach((config, name) => {
            window.document.removeEventListener(name, config.handler, config.options);
        });
    }

    initDrag(pageX: number, pageY: number) {
        this.isDragging = true;
        this.lastPageX = pageX;
        this.lastPageY = pageY;

        this.elementWidth = this.element.nativeElement.offsetWidth;
        this.elementHeight = this.element.nativeElement.offsetHeight;
        this.vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        this.vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    }

    onDrag(pageX: number, pageY: number) {
        if (this.isDragging) {
            const deltaX = pageX - this.lastPageX;
            const deltaY = pageY - this.lastPageY;
            const coords = this.element.nativeElement.getBoundingClientRect();
            let leftPos = coords.left + deltaX;
            let topPos = coords.top + deltaY;

            const overWidth = !this.dragOptions.dragInViewport || leftPos >= 0 && (leftPos + this.elementWidth) <= this.vw;
            const overHeight = !this.dragOptions.dragInViewport || topPos >= 0 && (topPos + this.elementHeight) <= this.vh;
            if (overWidth) {
                this.lastPageX = pageX;
            }
            if (overHeight) {
                this.lastPageY = pageY;
            }

            if (this.dragOptions.dragInViewport) {
                if (leftPos < 0) {
                    leftPos = 0;
                }
                if ((leftPos + this.elementWidth) > this.vw) {
                    leftPos = this.vw - this.elementWidth;
                }
                if (topPos < 0) {
                    topPos = 0;
                }
                if ((topPos + this.elementHeight) > this.vh) {
                    topPos = this.vh - this.elementHeight;
                }
            }

            this.renderer.setStyle(this.element.nativeElement, 'position', 'fixed');
            if (this.dragOptions.dragX) {
                this.renderer.setStyle(this.element.nativeElement, 'left', leftPos + 'px');
            }
            if (this.dragOptions.dragY) {
                this.renderer.setStyle(this.element.nativeElement, 'top', topPos + 'px');
            }
        }
    }

    endDrag() {
        this.isDragging = false;
    }

    getEvent(event: MouseEvent | TouchEvent): MouseEvent | Touch {
        if (event.type === 'touchend' || event.type === 'touchcancel') {
            return (event as TouchEvent).changedTouches[0];
        }
        return event.type.startsWith('touch') ? (event as TouchEvent).targetTouches[0] : event as MouseEvent;
    }
}
