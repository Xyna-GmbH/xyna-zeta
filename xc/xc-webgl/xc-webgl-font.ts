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
import { Type } from '@angular/core';

import { Observable, of, Subject } from 'rxjs/';
import * as THREE from 'three';


export enum XcWebGLFontAlignment {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right'
}


export class XcWebGLFont {

    protected static fontMap = new Map<string, THREE.Font>();
    protected static fontLoader = new THREE.FontLoader();

    static load<T extends XcWebGLFont>(url: string, clazz?: Type<T>, ...args: any[]): Observable<T | XcWebGLFont> {
        const createInstance = (font: THREE.Font): T | XcWebGLFont => clazz
            ? new clazz(font, ...args)
            : new XcWebGLFont(font);
        // return font from cache
        if (XcWebGLFont.fontMap.has(url)) {
            return of(createInstance(XcWebGLFont.fontMap.get(url)));
        }
        // load font from url and store in cache
        const subject = new Subject<T | XcWebGLFont>();
        XcWebGLFont.fontLoader.load(
            url,
            font => {
                XcWebGLFont.fontMap.set(url, font);
                subject.next(createInstance(font));
                subject.complete();
            },
            undefined,
            event => subject.error(event)
        );
        return subject.asObservable();
    }


    static getAlignmentFactor(alignment: XcWebGLFontAlignment): number {
        switch (alignment) {
            case XcWebGLFontAlignment.LEFT:   return 0.0;
            case XcWebGLFontAlignment.CENTER: return 0.5;
            case XcWebGLFontAlignment.RIGHT:  return 1.0;
        }
    }


    constructor(protected font: THREE.Font) {
    }


    protected createShapes(text: string, size: number, alignment: XcWebGLFontAlignment, padding: number, boundingBox: THREE.Box2): THREE.Shape[] {
        const shapes = this.font.generateShapes(text, size);
        shapes.forEach(shape =>
            shape.getPoints().forEach(point => {
                if (point.x < boundingBox.min.x) { boundingBox.min.x = point.x; }
                if (point.x > boundingBox.max.x) { boundingBox.max.x = point.x; }
                if (point.y < boundingBox.min.y) { boundingBox.min.y = point.y; }
                if (point.y > boundingBox.max.y) { boundingBox.max.y = point.y; }
            })
        );
        return shapes;
    }


    createGeometry(text: string, size: number, alignment = XcWebGLFontAlignment.CENTER, padding = 0): THREE.BufferGeometry {
        const boundingBox = new THREE.Box2(
            new THREE.Vector2(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
            new THREE.Vector2(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER)
        );
        const geometry = new THREE.ShapeBufferGeometry(this.createShapes(text, size, alignment, padding, boundingBox));
        geometry.computeBoundingBox();
        const width = boundingBox.max.x - boundingBox.min.x;
        const factor = XcWebGLFont.getAlignmentFactor(alignment);
        const alignmentOffset = -(boundingBox.min.x + factor * width);
        const paddingOffset   = -(factor * 2 - 1) * padding;
        return geometry.translate(alignmentOffset + paddingOffset, 0, 0);
    }
}
