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
/* eslint-disable @typescript-eslint/quotes */

//Test Roland

export const ZetaVersion = '14.0.2';


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
        "@angular/animations": "14.1.0",
        "@angular/cdk": "14.1.0",
        "@angular/common": "14.1.0",
        "@angular/compiler": "14.1.0",
        "@angular/core": "14.1.0",
        "@angular/forms": "14.1.0",
        "@angular/localize": "14.1.0",
        "@angular/material": "14.1.0",
        "@angular/platform-browser": "14.1.0",
        "@angular/platform-browser-dynamic": "14.1.0",
        "@angular/router": "14.1.0",
        "@angular/service-worker": "14.1.0",
        "escape-string-regexp": "5.0.0",
        "hammerjs": "2.0.8",
        "rxjs": "7.5.6",
        "three": "0.129.0",
        "tslib": "2.4.0",
        "zone.js": "0.11.7"
    },
    "devDependencies": {
        "@angular-devkit/build-angular": "14.2.11",
        "@angular-eslint/eslint-plugin": "14.0.2",
        "@angular/cli": "14.1.0",
        "@angular/compiler-cli": "14.1.0",
        "@angular/language-service": "14.1.0",
        "@types/node": "18.0.6",
        "@types/offscreencanvas": "2019.7.0",
        "@types/resize-observer-browser": "0.1.7",
        "@types/three": "0.129.1",
        "@typescript-eslint/eslint-plugin": "5.30.7",
        "@typescript-eslint/parser": "5.30.7",
        "eslint": "8.20.0",
        "eslint-plugin-import": "2.26.0",
        "eslint-plugin-jsdoc": "39.3.3",
        "eslint-plugin-prefer-arrow": "1.2.3",
        "eslint-plugin-zeta": "file:projects/xyna/src/app/zeta/lint/plugins/eslint-plugin-zeta",
        "ts-node": "10.9.1",
        "typescript": "4.7.4"
    }
};
