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
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, Injector, Type } from '@angular/core';

import { isString } from '../base';
import escapeStringRegexp from 'escape-string-regexp';

import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LocaleService } from './locale.service';


export interface I18nTranslation {
    key: string;
    value: string;
    /**
     * Optional notation for the better representation of the type of the key. Results to the key '<this.type>:<this.context>.<this.key>'
     */
    type?: string;
    /**
     * Optional notation for the better representation of the context of the key. Results to the key '<this.type>:<this.context>.<this.key>'
     */
    context?: string;
    /**
     * Optional parameter for the pronunciation language (e.g. 'en-US' or 'de-DE'). If none is specified, defaults to the 'lang'
     * attribute set above inside the DOM hierarchy
     */
    pronunciationLanguage?: string;
}

interface I18nCachedTranslation {
    translation: I18nTranslation;
    lastAccess: number;
}

export enum I18nCacheBehavior {
    NoCaching = 'NoCaching',
    CacheFoundKeys = 'CacheFoundKeys',
    CacheAllKeys = 'CacheAllKeys'
}

interface I18nJsonSchemaTranslation {
    translations: I18nTranslation[];
}

export interface I18nParam {
    key: string;
    value: string;
    translate?: boolean;
}

export enum NoI18nTranslationFoundBehavior {
    ReturnKey = 'ReturnKey',
    ReturnLastPartOfKey = 'ReturnLastPartOfKey',
    ReturnEmptyString = 'ReturnEmptyString',
    ThrowError = 'ThrowError'
}


export enum I18N_TYPES {
    button = 'button',
    input = 'input',
    checkbox = 'checkbox',
    autocomplete = 'autocomplete',
    table = 'table',
    label = 'label'
}


@Injectable()
export class I18nService {

    /** translation map: language -> (key -> value) */
    private readonly _translations = new Map<string, Map<string, I18nTranslation>>();
    private readonly _cache = new Map<string, Map<string, I18nCachedTranslation>>();

    /** currently selected language */
    private _language: string;

    private readonly _errorCodeRegEx = /(EC-[\da-z.]+)[\wQ#.,:;\-_ +*"´`'~!?=E]*/;

    noTranslationFoundDefaultBehavior = NoI18nTranslationFoundBehavior.ReturnKey;
    cacheBehavior = I18nCacheBehavior.CacheAllKeys;

    contextDismantlingSearch = false;


    BUTTON       = { translate: (key: string, ...params: I18nParam[]): string => this.translate(I18N_TYPES.button       + ':' + key, ...params) };
    INPUT        = { translate: (key: string, ...params: I18nParam[]): string => this.translate(I18N_TYPES.input        + ':' + key, ...params) };
    CHECKBOX     = { translate: (key: string, ...params: I18nParam[]): string => this.translate(I18N_TYPES.checkbox     + ':' + key, ...params) };
    AUTOCOMPLETE = { translate: (key: string, ...params: I18nParam[]): string => this.translate(I18N_TYPES.autocomplete + ':' + key, ...params) };
    TABLE        = { translate: (key: string, ...params: I18nParam[]): string => this.translate(I18N_TYPES.table        + ':' + key, ...params) };
    // xc-form-label
    LABEL        = { translate: (key: string, ...params: I18nParam[]): string => this.translate(I18N_TYPES.label        + ':' + key, ...params) };


    static i18nTypeForTagName = (tagName: string): string => {
        switch (tagName.toUpperCase()) {
            case 'XC-BUTTON': return I18N_TYPES.button;
            case 'XC-FORM-INPUT': return I18N_TYPES.input;
            case 'XC-CHECKBOX': return I18N_TYPES.checkbox;
            case 'XC-FORM-AUTOCOMPLETE': return I18N_TYPES.autocomplete;
            case 'XC-TABLE': return I18N_TYPES.table;
            case 'XC-FORM-label': return I18N_TYPES.label;
            default: return '';
        }
    };


    constructor(private readonly injector: Injector) {
        const localeService = injector.get(LocaleService);
        localeService.languageChange.subscribe(lang => this.language = lang);
    }


    /**
     * Cuts out the *nested* error code in a string with optional parameters
     * @param msg - error message as a string
     * @param customRegEx - (optional) regexp, wich will be executed on the message to cut out the error code and parameters
     * @param customArgumentPrefix - (optional) the char to identify the beginning of an argument
     * @example
     * I18nService.translateErrorCode("Java threw an error: EC-xfm.xtf.tproj.03#Alfred#Berta - stacktrace can be found in the server log");
     * // same as:
     * I18nService.translate('EC-xfm.xtf.tproj.03', {key: '{0}', value: I18nService.translate('Alfred')}, {key: '{1}', value: I18nService.translate('Berta')});
     */
    translateErrorCode(msg: string, customRegEx?: RegExp, customArgumentPrefix?: string): string {
        const res = (customRegEx || this._errorCodeRegEx).exec(msg);
        if (res && res.length) {
            const errorCode = res[1];
            const argString = res[0].replace(res[1], '');
            const args = argString.split(customArgumentPrefix || '#');
            args.splice(0, 1); // String.split() will create a the first array element empty
            const params: I18nParam[] =
                args.map((key: string, index: number) => ({key: '{' + index + '}', value: this.translate(key)}));
            return this.translate(errorCode, ...params);
        }
        console.warn('cannot find error code in \'' + msg + '\'');
        return this.translate(msg);
    }


    private retrieveTranslation(key: string): I18nTranslation {

        let cache: Map<string, I18nCachedTranslation>;
        let translation: I18nTranslation;

        if (this.cacheBehavior !== I18nCacheBehavior.NoCaching) {
            // gets the cache for the wanted language
            cache = this._cache.get(this.language);

            if (cache) {
                // tries to find a cached value for the given key
                const cacheValue = cache.get(key);
                if (cacheValue) {
                    cacheValue.lastAccess = Date.now();
                    cache.set(key, cacheValue);     // FIXME: Unnecessary?
                    return cacheValue.translation;
                }
            } else {
                // new cache for the wanted language - making sure that there is a cache
                cache = new Map<string, I18nCachedTranslation>();
                this._cache.set(this.language, cache);
            }

        }

        const translationMap = this._translations.get(this.language);

        // eslint-disable-next-line eqeqeq
        if (translationMap && key != undefined) {

            if (this.contextDismantlingSearch) {
                let curKey: string;
                let i = 0;
                const typeparts = key.split(':');
                const type = typeparts.length === 2 ? typeparts[0] : '';
                const path = typeparts.length === 2 ? typeparts[1] : typeparts[0];
                const parts: string[] = path.split('.');
                let withType = !!type;
                let looping = true;
                while (!translation && looping) {
                    curKey = (withType ? type + ':' : '') + parts.slice(i).join('.');
                    translation = translationMap.get(curKey);
                    i++;

                    if (i >= parts.length) {
                        if (withType) {
                            withType = false;
                            i = 0;
                        } else {
                            looping = false;
                        }
                    }
                }
            } else {
                translation = translationMap.get(key);
            }

            // only cache it if a valid value for given key was found
            if (this.cacheBehavior !== I18nCacheBehavior.NoCaching && isString(translation?.value)) {
                cache.set(key, {lastAccess: Date.now(), translation});
            }
        }

        // eslint-disable-next-line eqeqeq
        return (translation != undefined) ? translation : this.fulfillNoTranslationFoundBehavior(key, cache);
    }


    private fulfillNoTranslationFoundBehavior(key: string, cache: Map<string, I18nCachedTranslation>): I18nTranslation {
        const translation = <I18nTranslation>{ key, value: '' }; // NoI18nTranslationFoundBehavior.ReturnEmptyString

        if (this.noTranslationFoundDefaultBehavior === NoI18nTranslationFoundBehavior.ThrowError) {
            throw new Error('no translation found for \'' + key + '\' in the used I18nService instance with the language of \'' + this.language + '\'');
        }

        if (this.noTranslationFoundDefaultBehavior === NoI18nTranslationFoundBehavior.ReturnKey) {
            translation.value = key;
        }

        if (this.noTranslationFoundDefaultBehavior === NoI18nTranslationFoundBehavior.ReturnLastPartOfKey) {
            translation.value = key.split(':').pop().split('.').pop();
        }

        // cache the not found key because user wants to cache all keys
        if (this.cacheBehavior === I18nCacheBehavior.CacheAllKeys) {
            cache.set(key, {lastAccess: Date.now(), translation});
        }

        return translation;
    }


    hasTranslation(key: string): boolean {
        const translationMap = this._translations.get(this.language);
        return translationMap && translationMap.has(key);
    }


    /**
     * @param key Fully qualified key with optional type, optional context and key
     * @returns translated *key* including replaced *params*
     */
    translate(key: string, ...params: I18nParam[]): string {
        return this.getTranslation(key, ...params).value;
    }


    getTranslation(key: string, ...params: I18nParam[]): I18nTranslation {
        let translation = this.retrieveTranslation(key);

        // replace params
        if (params?.length > 0) {
            // make a clone to not changing the translation object inside the cache
            const tmp = <I18nTranslation>{};
            Object.assign(tmp, translation);
            translation = tmp;
            params.forEach(param => translation.value = translation.value.replace(new RegExp(escapeStringRegexp(param.key), 'g'), param.value));
        }

        return translation;
    }


    setTranslations(language: string, values: I18nTranslation[] = []) {
        const translationMap = this._translations.get(language) || this._translations.set(language, new Map()).get(language);
        values.forEach(item => {
            item.key = (item.type ? item.type + ':' : '') + (item.context ? item.context + '.' : '') + item.key;
            translationMap.set(item.key, item);
        });
    }


    /**
     * Requests and reads a json file in the "./assets/locale/" directory of the build and add the translations
     * to the instance.
     * Projects need to make sure that the requested json file is in this directory after compiling.
     * Check and modify the "angular.json" accordingly
     */
    readTranslations(language: string, file: string): Observable<I18nTranslation[]> {

        const httpBackend = this.injector.get<HttpBackend>(HttpBackend as Type<HttpBackend>);
        const nonInterceptedJSONHTTPClient: HttpClient = new HttpClient(httpBackend);

        return nonInterceptedJSONHTTPClient.get<I18nJsonSchemaTranslation>('./assets/locale/' + file).pipe(
            tap(translation => this.setTranslations(language, translation.translations)),
            map<I18nJsonSchemaTranslation, I18nTranslation[]>(translation => translation.translations)
        );
    }


    clearCache() {
        this._cache.clear();
    }


    removeOldCacheEntries(maxAge = 600000 /* 1min */) {
        const now = Date.now();
        const cache = this._cache.get(this.language);
        cache.forEach((entry, key) => {
            if (entry.lastAccess < now - maxAge) {
                cache.delete(key);
            }
        });
    }


    get language(): string {
        return this._language;
    }


    set language(value: string) {
        this._language = value;
    }
}
