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
import { AfterViewInit, Directive, ElementRef, EventEmitter, NgZone, OnDestroy, Output } from '@angular/core';

import { XcResizedEvent } from './xc-resized.event';


@Directive({
    selector: '[xc-resize-detector]'
})
export class XcResizeDetectorDirective implements AfterViewInit, OnDestroy {
    private readonly observer: ResizeObserver;
    private oldRect?: DOMRectReadOnly;

    @Output() readonly resizingDetector: EventEmitter<XcResizedEvent>;

    constructor(
        private readonly element: ElementRef,
        private readonly zone: NgZone
    ) {
        this.resizingDetector = new EventEmitter<XcResizedEvent>();
        this.observer = new ResizeObserver((entries: ResizeObserverEntry[]) => this.zone.run(() => this.observe(entries)));
    }

    ngAfterViewInit() {
        this.observer.observe(this.element.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer.disconnect();
    }

    private observe(entries: ResizeObserverEntry[]): void {
        const domSize = entries[0];
        const resizedEvent = new XcResizedEvent(domSize.contentRect, this.oldRect);
        this.oldRect = domSize.contentRect;
        this.resizingDetector.emit(resizedEvent);
    }
}
