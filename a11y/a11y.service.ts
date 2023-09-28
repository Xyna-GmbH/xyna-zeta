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
import { AriaLivePoliteness, LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, NgZone } from '@angular/core';

import { BehaviorSubject, Observable, Subject, Subscriber } from 'rxjs';
import { finalize } from 'rxjs/operators';


class A11yFocusState {
    constructor(
        public previousElement: Element,
        public event: FocusEvent,
        public type:  'focus' | 'blur',
        public achieved: 'mouse' | 'keyboard'
    ) {}
}

export enum ScreenreaderPriority {
    Off       = 'off',       // supported by all major screen readers
    Polite    = 'polite',    // speaks, when user is not doing anything - screen reader will not interrupt - is supported by all major screen readers.
    Assertive = 'assertive' // screen reader usually interrupts the user
}


@Injectable()
export class A11yService {

    private readonly visibilitySubject = new Subject<boolean>();

    private readonly lastPossibleFocusChangingEventSubject = new BehaviorSubject<Event>(null);
    private readonly lastActiveElementSubject = new BehaviorSubject<Element>(null);

    get visibilityChange(): Observable<boolean> {
        return this.visibilitySubject.asObservable();
    }

    emitElementFocusStateChange(element: Element): Observable<A11yFocusState> {

        let outsideSubscriber: Subscriber<A11yFocusState>;

        const onFocusFunction = (ev: FocusEvent) => {
            this.lastActiveElementSubject.next(document.activeElement);
            outsideSubscriber.next(new A11yFocusState(
                this.lastActiveElementSubject.value,
                ev,
                ev.type as ('focus' | 'blur'),
                this.lastPossibleFocusChangingEventSubject.value?.type === 'mousedown' ? 'mouse' : 'keyboard'
            ));
        };

        const onBlurFunction = (ev: FocusEvent) => {
            this.lastActiveElementSubject.next(document.activeElement);
            outsideSubscriber.next(new A11yFocusState(
                this.lastActiveElementSubject.value,
                ev,
                ev.type as ('focus' | 'blur'),
                this.lastPossibleFocusChangingEventSubject.value?.type === 'mousedown' ? 'mouse' : 'keyboard'
            ));
        };

        const observable = new Observable((subscriber: Subscriber<A11yFocusState>) => {
            outsideSubscriber = subscriber;
            this.ngZone.runOutsideAngular(() => {
                element.addEventListener('focus', onFocusFunction);
                element.addEventListener('blur', onBlurFunction);
            });
        });

        return observable.pipe(finalize(() => {
            element.removeEventListener('focus', onFocusFunction);
            element.removeEventListener('blur', onBlurFunction);
        }));
    }

    constructor(private readonly liveAnnouncer: LiveAnnouncer, private readonly ngZone: NgZone) {
        this.ngZone.runOutsideAngular(() => {

            document.addEventListener('visibilitychange', e => this.ngZone.run(() => this.visibilitySubject.next(!document.hidden)));

            document.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    this.lastActiveElementSubject.next(document.activeElement);
                    this.lastPossibleFocusChangingEventSubject.next(e);
                }
            });

            document.addEventListener('mousedown', (e: MouseEvent) => {
                this.lastActiveElementSubject.next(document.activeElement);
                this.lastPossibleFocusChangingEventSubject.next(e);
            });
        });
    }

    screenreaderSpeak(text: string, priority: ScreenreaderPriority = ScreenreaderPriority.Polite): Observable<void> {
        const subj = new Subject<void>();
        let ap: AriaLivePoliteness;
        switch (priority) {
            case ScreenreaderPriority.Assertive: ap = 'assertive'; break;
            case ScreenreaderPriority.Polite: ap = 'polite'; break;
            case ScreenreaderPriority.Off: ap = 'off'; break;
        }
        this.liveAnnouncer.announce(text, ap).then(
            () => {
                subj.next();
                subj.complete();
            },
            reason => {
                subj.error(reason);
                subj.complete();
            }
        );

        return subj.asObservable();
    }
}
