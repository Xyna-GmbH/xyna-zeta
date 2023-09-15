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
import { Injectable } from '@angular/core';
import { encodeURIComponentRFC1738 } from '../base';



export interface UrlQueryParam {
    key?: string;
    value?: string;
}

export function UrlQueryParamDecode(rawString: string): UrlQueryParam {
    const index = rawString.indexOf('=');
    return index > -1 ? { key: rawString.substr(0, index), value: rawString.substr(index + 1)} : {};
}

export enum UrlQueryParamConflictResolutionMethod {
    Replace = 1, None
}

@Injectable()
export class QueryParameterService {

    private readonly queries = new Map<string, string>();
    private readonly defaultConflictResolution = UrlQueryParamConflictResolutionMethod.Replace;

    has(key: string): boolean {
		this.syncServiceWithUrl();
        return this.queries.has(key);
    }

    add(key: string, value: string, localConflictResolution?: UrlQueryParamConflictResolutionMethod) {
        localConflictResolution = localConflictResolution || this.defaultConflictResolution;
        if (!this.queries.has(key) || localConflictResolution === UrlQueryParamConflictResolutionMethod.Replace) {
            this.queries.set(key, value);
            this.syncUrlWithService();
        }
    }

    static createQueryValue(rtc: string, fqn: string, type: string): string {
        return encodeURIComponentRFC1738(JSON.stringify({rtc, fqn, type}));
    }

    getValue(key: string): string {
        this.syncServiceWithUrl();
        return this.queries.get(key);
    }


    getParamsStartWith(prefix: string): UrlQueryParam[] {
        this.syncServiceWithUrl();

        const params: UrlQueryParam[] = [];
        if (this.queries && this.queries.size) {
            this.queries.forEach((v, k) => {
                if (k.startsWith(prefix)) {
                    params.push({key: k, value: v});
                }
            });
        }

        return params;
    }

    removeParamsStartWith(prefix: string) {
        const arr = this.getParamsStartWith(prefix);
        this.remove(...(arr.map<string>(p => p.key)));
    }

    remove(...keys: string[]) {
        let key: string;
        for (key of keys) {
            this.queries.delete(key);
        }
        this.syncUrlWithService();
    }

    clear() {
        this.queries.clear();
        this.syncUrlWithService();
    }

    private syncUrlWithService() {
        const arr: string[] = [];
        if (this.queries && this.queries.size) {
            this.queries.forEach((v, k) => arr.push(k + '=' + v));
        }
        window.history.pushState({}, null, this.getCleanUrl() + (arr.length ? '?' + arr.join('&') : ''));
    }

    private syncServiceWithUrl() {
        let q: UrlQueryParam;
        this.queries.clear();
        for (q of this.getUrlQueryParams()) {
            this.queries.set(q.key, q.value);
        }
    }

    getUrlQueryParams(): UrlQueryParam[] {
        const str = this.getQueryParamsAsString();
        const raw = str ? str.split('&') : [];
        return raw?.length
            ? (raw.map<UrlQueryParam>(rawQuery => UrlQueryParamDecode(rawQuery)))
            : [];
    }

    private getQueryParamsAsString(): string {
        return window.location.search.substring(1);
    }

    private getCleanUrl(): string {
        const url = window.location.href;
        const indexQ = url.indexOf('?');
        return indexQ >= 0 ? url.substr(0, indexQ) : url;
    }

}
