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
/* eslint-disable @typescript-eslint/quotes */
export const ZetaVersion = '[WIP]';


export const ZetaScripts = {
    "scripts": {
        "start": "ng serve",
        "start:ssl": "ng serve --ssl=true --ssl-key=./ssl/server-public.pem",
        "release": "ng build xyna --prod --extract-licenses",
        "lint": "eslint --color -c .eslintrc.json --ext .ts ./projects/xyna/src/app",
        "lint:fix": "npm run lint -- --fix"
    }
};


export const ZetaDependencies = {
    "dependencies": {
        "hammerjs": "2.0.8",
        "zone.js": "0.11.3",
        "rxjs": "6.6.3",
        "tslib": "2.1.0",
        "escape-string-regexp": "^5.0.0",

        // threejs
        "three": "0.129.0",

        // material
        "@angular/material": "11.1.1",
        "@angular/cdk": "11.1.1",

        // angular
        "@angular/animations": "11.1.1",
        "@angular/common": "11.1.1",
        "@angular/compiler": "11.1.1",
        "@angular/core": "11.1.1",
        "@angular/forms": "11.1.1",
        "@angular/localize": "11.1.1",
        "@angular/platform-browser": "11.1.1",
        "@angular/platform-browser-dynamic": "11.1.1",
        "@angular/router": "11.1.1",
        "@angular/service-worker": "11.1.1",

        // xliffmerge
        "@ngx-i18nsupport/tooling": "^8.0.3"
    },
    "devDependencies": {
        "ts-node": "9.1.1",
        "typescript": "4.1.3",
        "@types/node": "14.14.22",
        "@types/three": "0.129.1",
        "@typescript-eslint/eslint-plugin": "4.15.0",
        "@typescript-eslint/parser": "4.15.0",
        "eslint": "7.19.0",
        "eslint-plugin-import": "2.22.1",
        "eslint-plugin-jsdoc": "31.6.1",
        "eslint-plugin-prefer-arrow": "1.2.3",
        "eslint-plugin-zeta": "file:projects/xyna/src/app/zeta/lint/plugins/eslint-plugin-zeta",

        // angular
        "@angular-eslint/eslint-plugin": "1.1.0",
        "@angular-devkit/build-angular": "0.1101.2",
        "@angular/cli": "11.1.2",
        "@angular/compiler-cli": "11.1.1",
        "@angular/language-service": "11.1.1",

        // xliffmerge
        "@ngx-i18nsupport/ngx-i18nsupport": "^1.1.6"
    }
};
