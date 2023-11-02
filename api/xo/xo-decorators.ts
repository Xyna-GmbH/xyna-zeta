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
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { defineAccessorProperty, NativeArray } from '../../base';
import { XoConsistencyCheck } from './xo-consistency';
import { FullQualifiedName, RuntimeContext } from './xo-describer';
import { XoAccessorMap, XoAccessorPropertyMap, XoArray, XoArrayClassInterface, XoObject, XoObjectClassInterface, XoSanitizePropertyKey, XoWrapper } from './xo-object';

/* eslint-disable brace-style */

const ctorAsyncMap = new Map<Function, Map<string, Subject<any>>>();


/**
 * Decorator for an xo object class. If path and name don't result in a valid fqn,
 * it is deduced from the given base class (if any). The same applies to the rtc.
 * @param baseClass Class to inherit from or NULL
 * @param path Path of the object's fqn
 * @param name Name of the object's fqn
 * @param rtc Runtime context of the object
 */
export function XoObjectClass(baseClass: XoObjectClassInterface, path?: string, name?: string, rtc?: RuntimeContext) {
    return function <T extends XoObjectClassInterface>(clazz: T) {
        let accessorMap: XoAccessorMap;
        const decorator = class XoObjectDecorator extends clazz {
            static ctor = Object.getPrototypeOf(XoObjectDecorator);
            // static functions for decorator class
            static getAccessorMap() { return accessorMap ??= XoAccessorPropertyMap(XoObjectDecorator); }
            static getAsyncMap()    { return ctorAsyncMap.get(XoObjectDecorator.ctor) ?? ctorAsyncMap.set(XoObjectDecorator.ctor, new Map()).get(XoObjectDecorator.ctor); }
            // static properties for decorator class
            static readonly derivedClasses = new Map();
            static readonly rtc = rtc ?? baseClass?.rtc;
            static readonly fqn = FullQualifiedName.fromPathName(path, name) ?? baseClass?.fqn;
            // overwrite get/set instance methods
            get derivedClasses(): ReadonlyMap<string, XoObjectClassInterface> { return XoObjectDecorator.derivedClasses; }
            get decoratorClass(): XoObjectClassInterface                      { return XoObjectDecorator; }
            get rtc(): RuntimeContext         { return this._rtc ?? XoObjectDecorator.rtc; }
            set rtc(value: RuntimeContext)    { this._rtc = value; }
            get fqn(): FullQualifiedName      { return this._fqn ?? XoObjectDecorator.fqn; }
            set fqn(value: FullQualifiedName) { this._fqn = value; }
        };
        /*
         * Find already stored class as base - in case of a duplicate model definition for the baseClass,
         * baseClass and base will differ. Using the already existing class from the derivatives-tree, the
         * duplicate definition will just be ignored and won't cause any problems when looking for the
         * correct deriving class.
         */
        const base = baseClass?.fqn
            ? XoObject.instance.getDerivedClass('', baseClass.fqn)
            : XoObject;

        // only store model as a derivative, if another class with same FQN hasn't been stored, yet (ignoring duplicates)
        const fqnString = decorator.fqn.encode();
        if (!base.derivedClasses.has(fqnString)) {
            (base.derivedClasses as Map<string, XoObjectClassInterface>).set(fqnString, decorator);
        } else {
            console.warn(`Hint: Duplicate model definition for "${fqnString}". Only one model definition will be used, others will be ignored.`);
        }
        // add to consistency check
        XoConsistencyCheck.addObjectClass(decorator);
        return decorator;
    };
}


/**
 * Decorator for an xo array class. If object class is NULL, array entries will be
 * instantiated by the xo object class.
 * @param genericClass Class, which array entries are derived from
 */
export function XoArrayClass(genericClass: XoObjectClassInterface) {
    return function <T extends XoArrayClassInterface>(clazz: T) {
        const decorator = class XoArrayDecorator extends clazz {
            // static properties for decorator class
            static readonly genericClass = genericClass;
            static readonly derivedClasses = new Map();
            static readonly rtc = genericClass?.rtc;
            static readonly fqn = genericClass?.fqn;
            // overwrite get/set instance methods
            get genericClass(): XoObjectClassInterface                       { return XoArrayDecorator.genericClass; }
            get derivedClasses(): ReadonlyMap<string, XoArrayClassInterface> { return XoArrayDecorator.derivedClasses; }
            get decoratorClass(): XoArrayClassInterface                      { return XoArrayDecorator; }
            get rtc(): RuntimeContext         { return this._rtc ?? XoArrayDecorator.rtc; }
            set rtc(value: RuntimeContext)    { this._rtc = value; }
            get fqn(): FullQualifiedName      { return this._fqn ?? XoArrayDecorator.fqn; }
            set fqn(value: FullQualifiedName) { this._fqn = value; }
        };
        // add to the base class' list of derived classes (if another class with same FQN hasn't been stored, yet)
        const fqnString = decorator.fqn.encode();
        if (!XoArray.derivedClasses.has(fqnString)) {
            (XoArray.derivedClasses as Map<string, XoArrayClassInterface>).set(decorator.fqn.encode(), decorator);
        }
        // add to consistency check
        XoConsistencyCheck.addArrayClass(decorator);
        return decorator;
    };
}


/**
 * Decorator for a property within an xo object class. If property class is NULL, the
 * property will be treated as being of a primitive type (boolean, number or string).
 * @param propertyClass Class, which property is derived from
 */
export function XoProperty(propertyClass?: XoObjectClassInterface | XoArrayClassInterface) {
    return function(target: XoObject, key: string) {
        // delete property
        if (delete target[key]) {
            // create new property with getter and setter
            let enumValues = new Set();
            const observable = target.enumeratedProperties.get(key);
            if (observable) {
                observable.subscribe((data: any[]) => enumValues = new Set(data));
            }
            const wrapper = target.wrappedProperties.get(key);
            const sanitizedKey = XoSanitizePropertyKey(key);
            Object.defineProperty(target, key, {
                enumerable: true,
                get: wrapper
                    ? function() {
                        return wrapper.wrap(this.data[sanitizedKey]);
                    }
                    : function() {
                        return this.data[sanitizedKey];
                    },
                set: target.readonlyProperties.has(key)
                    ? function() {}
                    : observable
                        ? function(value) {
                            if (value == null || enumValues.has(value)) {
                                this.data[sanitizedKey] = value;
                            }
                        }
                        : wrapper
                            ? function(value) {
                                this.data[sanitizedKey] = wrapper.unwrap(value);
                            }
                            : function(value) {
                                this.data[sanitizedKey] = value;
                            }
            });
            // define properties map on target's prototype and store property name with class
            const map = new Map(target.properties);
            defineAccessorProperty<XoObject, Map<string, typeof propertyClass>>(target, 'properties', () => map).set(key, propertyClass);
        }
    };
}


/**
 * Decorator for an enumerated property, which denotes its assignable values.
 */
export function XoEnumerated(values: NativeArray = []) {
    return function(target: XoObject, key: string) {
        const ctor = target.constructor;
        const asyncMap = ctorAsyncMap.get(ctor) ?? ctorAsyncMap.set(ctor, new Map()).get(ctor);
        const subject = asyncMap.get(key) ?? asyncMap.set(key, new BehaviorSubject(values)).get(key);
        const map = new Map(target.enumeratedProperties);
        defineAccessorProperty<XoObject, Map<string, Observable<NativeArray>>>(target, 'enumeratedProperties', () => map).set(key, subject.asObservable());
    };
}


/**
 * Decorator for a wrapped property, which denotes its wrapper.
 */
export function XoWrapped(wrapper: XoWrapper) {
    return function(target: XoObject, key: string) {
        const map = new Map(target.wrappedProperties);
        defineAccessorProperty<XoObject, Map<string, XoWrapper>>(target, 'wrappedProperties', () => map).set(key, wrapper);
    };
}


/**
 * Decorator for a transient property, which is being omited during the encoding process.
 */
export function XoTransient() {
    return function(target: XoObject, key: string) {
        const set = new Set(target.transientProperties);
        defineAccessorProperty<XoObject, Set<string>>(target, 'transientProperties', () => set).add(key);
    };
}


/**
 * Decorator for a readonly property, which is not assignable by the generated property's
 * setter function.
 */
export function XoReadonly() {
    return function(target: XoObject, key: string) {
        const set = new Set(target.readonlyProperties);
        defineAccessorProperty<XoObject, Set<string>>(target, 'readonlyProperties', () => set).add(key);
    };
}


/**
 * Decorator for a unique property, which marks itself as a part of the unique key of the
 * xo object instance.
 */
export function XoUnique() {
    return function(target: XoObject, key: string) {
        const set = new Set(target.uniqueProperties);
        defineAccessorProperty<XoObject, Set<string>>(target, 'uniqueProperties', () => set).add(key);
    };
}


/**
 * Decorator for an i18n property, which will automatically be translated by the I18nService.
 */
export function XoI18n() {
    return function(target: XoObject, key: string) {
        const set = new Set(target.i18nProperties);
        defineAccessorProperty<XoObject, Set<string>>(target, 'i18nProperties', () => set).add(key);
    };
}
