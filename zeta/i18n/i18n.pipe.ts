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
import { ElementRef, Pipe, PipeTransform } from '@angular/core';

import { XcI18nBase } from './i18n.directive';
import { I18nService } from './i18n.service';


/**
 * @deprecated Use *XcI18nPipe* instead
 */
@Pipe({
    name: 'i18n'
})
export class I18nPipe implements PipeTransform {

    constructor(private readonly i18nService: I18nService) {
    }


    transform(value: string, ...params: any[]): string {
        return this.i18nService.translate(value, ...params.map(
            (param: string, index: number) => ({key: '$' + index, value: param})
        ));
    }
}


@Pipe({
    name: 'xcI18n'
})
export class XcI18nPipe extends XcI18nBase implements PipeTransform {

    constructor(private readonly i18nService: I18nService, private readonly element: ElementRef<HTMLElement>) {
        super();
    }


    transform(value: string, ...params: any[]): string {
        const context = this.getContext(this.element.nativeElement);
        const translation = this.i18nService.getTranslation(context ? context + '.' + value : value, ...params.map(
            (param: string, index: number) => ({key: '$' + index, value: param})
        ));

        if (translation?.pronunciationLanguage) {
            this.element.nativeElement?.parentElement?.setAttribute('lang', translation.pronunciationLanguage);
        }

        return translation?.value;
    }
}
