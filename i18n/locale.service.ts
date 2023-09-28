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
import { Injectable, LOCALE_ID, Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class LocaleService {

    static readonly DE_DE = 'de-DE';
    static readonly EN_US = 'en-US';

    /** currently selected language */
    private readonly languageSubject = new BehaviorSubject<string>(LocaleService.EN_US);


    constructor(route: ActivatedRoute) {

        const html = document.querySelector('html');
        const lang = html?.getAttribute('lang') ?? null;
        if (lang) {
            // TODO extend for multiple languages
            this.languageSubject.next(LocaleService.DE_DE.startsWith(lang) ? LocaleService.DE_DE : LocaleService.EN_US);
        }
    }


    get language(): string {
        return this.languageSubject.value;
    }


    set language(value: string) {
        this.languageSubject.next(value);

        const html = document.querySelector('html');
        if (html) {
            const langSubtag = /([^-]*)/g.exec(value)[0];
            html.setAttribute('lang', langSubtag);
        }
    }


    get languageChange(): Observable<string> {
        return this.languageSubject.asObservable();
    }
}



export class LocaleId extends String {
    constructor(private readonly locale: LocaleService) {
        super();
    }

    toString(): string {
        return this.locale.language;
    }

    valueOf(): string {
        return this.toString();
    }
}



export const LocaleProvider: Provider = {
    provide: LOCALE_ID,
    useClass: LocaleId,
    deps: [LocaleService]
};
