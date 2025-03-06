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
import { BufferAttribute, BufferGeometry, Line, Material, Mesh, Object3D, Points } from 'three';

import { Constructor } from '../../base';


export enum XcWebGLObjectAttributeName {
    POSITION = 'position',
    NORMAL = 'normal',
    UV = 'uv'
}


export type XcWebGLObjectAttributeType =
    Int8ArrayConstructor |
    Uint8ArrayConstructor |
    Uint8ClampedArrayConstructor |
    Int16ArrayConstructor |
    Uint16ArrayConstructor |
    Int32ArrayConstructor |
    Uint32ArrayConstructor |
    Float32ArrayConstructor |
    Float64ArrayConstructor;


export interface XcWebGLObjectAttribute {
    attr: BufferAttribute;
    name: XcWebGLObjectAttributeName;
    type: XcWebGLObjectAttributeType;
    size: number;
}


export class XcWebGLObject<S extends Points | Line | Mesh, R extends Material> {
    private readonly _object: S;
    private readonly _material: R;
    private readonly _parent: Object3D;
    private readonly _attributes = new Map<XcWebGLObjectAttributeName, XcWebGLObjectAttribute>();


    static getAttribute(name: XcWebGLObjectAttributeName, type: XcWebGLObjectAttributeType, size: number, data?: any): XcWebGLObjectAttribute {
        return {name, type, size, attr: new BufferAttribute(new type(data), size)};
    }


    static getPositionAttribute(type: XcWebGLObjectAttributeType, size: number, data?: any): XcWebGLObjectAttribute {
        return XcWebGLObject.getAttribute(XcWebGLObjectAttributeName.POSITION, type, size, data);
    }


    static getNormalAttribute(type: XcWebGLObjectAttributeType, size: number, data?: any): XcWebGLObjectAttribute {
        return XcWebGLObject.getAttribute(XcWebGLObjectAttributeName.NORMAL, type, size, data);
    }


    static getUVAttribute(type: XcWebGLObjectAttributeType, size: number, data?: any): XcWebGLObjectAttribute {
        return XcWebGLObject.getAttribute(XcWebGLObjectAttributeName.UV, type, size, data);
    }


    constructor(clazz: Constructor<S>, material: R, parent: Object3D, attributes: XcWebGLObjectAttribute[]) {
        if (clazz) {
            this._material = material;
            this._parent = parent;
            // create mesh
            this._object = new clazz(new BufferGeometry(), material);
            this._object.matrixAutoUpdate = false;
            this.show();
            // set attributes
            attributes.forEach(attribute => this.setAttribute(attribute));
        }
    }


    protected setAttribute(attribute: XcWebGLObjectAttribute) {
        this.geometry.setAttribute(attribute.name, this._attributes.set(attribute.name, attribute).get(attribute.name).attr);
    }


    get object(): S {
        return this._object;
    }


    get material(): R {
        return this._material;
    }


    get parent(): Object3D {
        return this._parent;
    }


    get geometry(): BufferGeometry {
        return this.object.geometry;
    }


    dispose() {
        this.hide();
        if (this.object) {
            this.object.geometry.dispose();
        }
    }


    show() {
        if (this.parent) {
            this.parent.add(this.object);
        }
    }


    hide() {
        if (this.parent) {
            this.parent.remove(this.object);
        }
    }


    setVisible(visible: boolean) {
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    }


    hasPositionAttribute(): boolean {
        return this._attributes.has(XcWebGLObjectAttributeName.POSITION);
    }


    hasNormalAttribute(): boolean {
        return this._attributes.has(XcWebGLObjectAttributeName.NORMAL);
    }


    hasUVAttribute(): boolean {
        return this._attributes.has(XcWebGLObjectAttributeName.UV);
    }


    getAttributeNames(): XcWebGLObjectAttributeName[] {
        return Array.from(this._attributes.keys());
    }


    setData(name: XcWebGLObjectAttributeName, data: number[]) {
        if (this.object) {
            const attribute = this._attributes.get(name);
            if (attribute) {
                if (attribute.attr.array.length === data.length) {
                    // update internal array
                    attribute.attr.array = new attribute.type(data);
                    attribute.attr.needsUpdate = true;
                } else {
                    // replace attribute
                    this.setAttribute(XcWebGLObject.getAttribute(name, attribute.type, attribute.size, data));
                }
                // we need to recompute the bounding sphere (important for frustum culling)
                if (name === XcWebGLObjectAttributeName.POSITION) {
                    this.object.geometry.computeBoundingSphere();
                }
            }
        }
    }
}
