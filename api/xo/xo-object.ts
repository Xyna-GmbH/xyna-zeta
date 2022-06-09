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
import { Observable, Subject, throwError } from 'rxjs/';
import { catchError, filter, map } from 'rxjs/operators';

import { boxedBooleanToString, boxedNumberToString, Comparable, Constructor, downloadFile, isArray, isObject, MimeTypes, Native, NativeArray, stringToBoxedBoolean, stringToBoxedFloat, stringToBoxedInteger, stringToUnboxedBoolean, stringToUnboxedFloat, stringToUnboxedInteger, TypeFilterOut, TypePropertiesOf, unboxedBooleanToString, unboxedNumberToString, uniquify, uploadFile, UploadResultStatus } from '../../base';
import { FullQualifiedName, RuntimeContext, XoDescriber, XoDescriberString } from './xo-describer';


export interface XoJson {
    $meta: { fqn: string; rtc?: object };
    $list?: object;
}


export interface XoClassInterface<T extends Xo = Xo> extends Constructor<T> {
    instance: Xo;
    rootClass: XoClassInterface;
    derivedClasses: ReadonlyMap<string, XoClassInterface>;
    rtc: RuntimeContext;
    fqn: FullQualifiedName;
}


export interface XoObjectClassInterface<T extends XoObject = XoObject> extends XoClassInterface<T> {
    getAccessorMap(): XoAccessorMap<XoObject>;
    getAsyncMap<I>(): ReadonlyMap<string, Subject<I>>;
    rootClass: XoObjectClassInterface;
}


export interface XoArrayClassInterface<T extends XoArray = XoArray> extends XoClassInterface<T> {
    genericClass: XoObjectClassInterface;
    rootClass: XoArrayClassInterface;
}


const XoSanitizePropertyKeyRegexp = /[^A-Za-z0-9_]+/g;
export function XoSanitizePropertyKey(key: string): string {
    return XoSanitizePropertyKeyRegexp[Symbol.replace](key, '');
}


///////////////////////////////////////////////////////////////////////////////
//  XO
///////////////////////////////////////////////////////////////////////////////


export abstract class Xo extends Comparable implements XoDescriber {

    static readonly XoFileNameIdentSeparator = '@';

    /**
     * Allows the user to select a json text file representation of an xo instance and returns an
     * observable of the instantiated xo. The file name should contain the ident of the xo separated
     * from the optional fqn string by the '@' character (as produced by the download function).
     * @param clazz Class of the xo instance
     */
    static upload?<T extends Xo>(clazz: XoClassInterface<T>): Observable<T> {
        return uploadFile(MimeTypes.json).pipe(
            filter(result => result.status === UploadResultStatus.UploadDone),
            map(result => ({
                ident: result.file.name.substring(0, result.file.name.indexOf(this.XoFileNameIdentSeparator)),
                json: <XoJson>JSON.parse(result.stream)
            })),
            map(data => new clazz(data.ident).decode(data.json)),
            catchError(() => throwError('invalid json'))
        );
    }

    /**
     * Downloads a json text file representation of an xo instance
     * @param xo Xo instance
     */
    static download?(xo: Xo, space?: string | number) {
        downloadFile(
            xo.stringify(space),
            [...(xo.ident ? [xo.ident] : []), xo.fqn.encode()].join(this.XoFileNameIdentSeparator),
            MimeTypes.json
        );
    }

    /** Class of XoObject to bypass circular reference issues */
    static XoObject?: XoObjectClassInterface;

    /** Class of XoArray to bypass circular reference issues */
    static XoArray?: XoArrayClassInterface;

    /** Needed to comply with XoClassInterface inside XoObjectClassDecorator and XoArrayClassDecorator */
    static readonly rtc: RuntimeContext;

    /** Needed to comply with XoClassInterface inside XoObjectClassDecorator and XoArrayClassDecorator */
    static readonly fqn: FullQualifiedName;

    /** Stores the runtime context of the xo */
    protected _rtc: RuntimeContext;

    /** Stores the full qualified name of the xo */
    protected _fqn: FullQualifiedName;

    /** Stores data in an object map or array */
    protected readonly _data: any;

    /**
     * Constructor initializing data
     * @param ident Xo identifier used in exported filename for example
     */
    constructor(protected readonly _ident = '') {
        super();
        this._data = this.defaultData();
    }

    /**
     * Returns value to initialize data with
     * @returns Initial data value
     */
    protected abstract defaultData(): any;

    /**
     * Decodes data from json
     * @param from Object to decode data from
     */
    protected abstract decodeData(from: any): void;

    /**
     * Encodes data into a given object
     * @param into Object to encode data into
     */
    protected abstract encodeData(into: any): void;

    /**
     * Returns the base class for the property with the given identifier
     * @param ident Identifying property name or index within XoObject or XoArray, respectively
     * @returns Xo class
     */
    protected abstract getBaseClass(ident: string): XoClassInterface;

    /**
     * Returns a set with all recursively derived classes of a given base class
     * @param baseClass Base class to get derived classes of
     * @returns Set of xo classes
     */
    protected getDerivedClasses(baseClass: XoClassInterface): Map<string, XoClassInterface> {
        const classMap = new Map<string, XoClassInterface<Xo>>();
        const baseClassFallback = baseClass ?? this.constructor as XoClassInterface;
        if (baseClassFallback.derivedClasses && (baseClassFallback.rootClass === Xo.XoObject || baseClassFallback.rootClass === Xo.XoArray)) {
            baseClassFallback.derivedClasses.forEach((value, key) => {
                classMap.set(key, value);
                this.getDerivedClasses(value).forEach((v, k) => classMap.set(k, v));
            });
        }
        return classMap;
    }

    /**
     * Returns a class extending XoObject or XoArray with a corresponding fqn
     * @param ident Identifying property name or index within XoObject or XoArray, respectively
     * @param fqn Fqn to get a corresponding class for
     * @returns Xo class
     */
    getDerivedClass(ident: string, fqn: FullQualifiedName, defaultBaseClass?: XoClassInterface): XoClassInterface {
        const baseClass = this.getBaseClass(ident) || defaultBaseClass;
        return this.getDerivedClasses(baseClass).get(fqn.encode()) ?? baseClass;
    }

    /**
     * Returns an instance of a class extending XoObject class with a corresponding fqn
     * @param ident Identifying property name within the XoObject
     * @param fqn Fqn to get a corresponding instance for
     * @returns XoObject class instance
     */
    protected getDerivedObjectInstance(ident: string, fqn: FullQualifiedName): Xo {
        // default to plain XoObject class instance, if derived instance is not provided or of wrong type (object vs. array)
        const derivedClass = this.getDerivedClass(ident, fqn, Xo.XoObject);
        return (derivedClass && derivedClass.rootClass === Xo.XoObject)
            ? new derivedClass(ident)
            : new Xo.XoObject(ident);
    }

    /**
     * Returns an instance of a class extending XoArray class with a corresponding fqn
     * @param ident Identifying index within the XoArray
     * @param fqn Fqn to get a corresponding instance for
     * @returns XoArray class instance
     */
    protected getDerivedArrayInstance(ident: string, fqn: FullQualifiedName): Xo {
        // default to plain XoArray class instance, if derived instance is not provided or of wrong type (object vs. array)
        const derivedClass = this.getDerivedClass(ident, fqn, Xo.XoArray);
        return (derivedClass && derivedClass.rootClass === Xo.XoArray)
            ? new derivedClass(ident)
            : new Xo.XoArray(ident);
    }

    /**
     * Decodes sub data
     * @param sub Sub data to decode
     * @param ident Identifying property name or index within the XoObject or XoArray, respectively
     */
    protected decodeSubData(sub: any, ident: string) {
        if (isObject(sub) && isObject(sub.$meta)) {
            const fqn = FullQualifiedName.decode(sub.$meta.fqn);
            return !isArray(sub.$list)
                ? this.getDerivedObjectInstance(ident, fqn).decode(sub, this)
                : this.getDerivedArrayInstance(ident, fqn).decode(sub, this);
        }
        return sub;
    }

    /**
     * Encodes sub data
     * @param sub Sub data to encode
     * @returns Encoded sub data
     */
    protected encodeSubData(sub: any): any {
        return sub instanceof Xo
            ? sub.encode(null, this)
            : isArray(sub)
                ? sub.slice(0)
                : sub;
    }

    /**
     * Decodes the full qualified name from an xo json object
     * @param json Xo json object
     */
    protected decodeFqn(json: XoJson): FullQualifiedName {
        const metaFqn = FullQualifiedName.decode(json.$meta.fqn);
        if (this.fqn && !this.fqn.equals(metaFqn)) {
            console.warn('[XO] incompatible fqn! for member "' + this.ident + '" (server ' + metaFqn + ' != client ' + this.fqn + ')');
        }
        return metaFqn;
    }

    /**
     * Decodes the runtime context from an xo json object
     * @param json Xo json object
     */
    protected decodeRtc(json: XoJson): RuntimeContext {
        const metaRtc = RuntimeContext.decode(json.$meta.rtc);
        if (this.rtc && !this.rtc.equals(metaRtc)) {
            console.warn('[XO] incompatible rtc! (server ' + metaRtc + ' != client ' + this.rtc + ')');
        }
        return metaRtc;
    }

    /**
     * Called right before encoding the xo
     */
    protected beforeEncode() {
    }

    /**
     * Called right after encoding the xo
     */
    protected afterEncode() {
    }

    /**
     * Called right before decoding the xo
     */
    protected beforeDecode() {
    }

    /**
     * Called right after decoding the xo
     */
    protected afterDecode() {
    }

    /**
     * Decodes a JSON and stores the data inside of this instance. Do not override this function, use afterDecode() instead.
     * @return Self
     */
    decode(from?: XoJson, parent?: Xo): this {
        this.beforeDecode();
        if (isObject(from)) {
            if (isObject(from.$meta)) {
                this.fqn = this.decodeFqn(from);
                this.rtc = this.decodeRtc(from);
                // take rtc from parent, if not set
                if (parent) {
                    this.rtc = this.rtc ?? parent.rtc;
                } else if (!this.rtc) {
                    console.warn('[XO] missing rtc in root!');
                }
            }
            this.decodeData(from);
        }
        this.afterDecode();
        return this;
    }

    /**
     * Encodes this instance to a JSON. Do not override this function, use beforeEncode() instead.
     * @return The JSON this instance is encoded into
     */
    encode(into?: XoJson, parent?: Xo): XoJson {
        this.beforeEncode();
        if (!into) {
            into = { $meta: { fqn: this.fqn.encode() } };
            // omit rtc, if same as in parent
            if (this.rtc) {
                into.$meta.rtc = !parent || !this.rtc.equals(parent.rtc)
                    ? this.rtc.encode()
                    : undefined;
            }
        }
        this.encodeData(into);
        this.afterEncode();
        return into;
    }

    /**
     * Returns a clone of the xo by decoding and encoding itself
     * @return Cloned xo
     */
    clone(): this {
        return (new ((this as any).constructor)(this.ident) as this).decode(this.encode());
    }

    /**
     * Returns the string containing the encoded json of the xo
     * @param space Determines white space indentation
     * @return String with encoded json
     */
    stringify(space?: string | number): string {
        return JSON.stringify(this.encode(), null, space);
    }

    /**
     * Resolves a data field and returns its value. The notation to resolve a data field is as follows:
     * 'abc.def.2.ghi' will resolve child 'abc' which should be an xo object, therein the child 'def',
     * which should be an xo array, therein the entry with index '2', which should be an xo object and
     * finally the child 'ghi', which can be anything.
     * @param path Path to the data field
     * @return Value of data field or NULL, if path could not be resolved
     */
    resolve(path: string): any {
        if (path.length > 0) {
            const idx = path.indexOf('.');
            const head = path.substring(0, idx) || path;
            const tail = path.substring(head.length + 1);
            const object = this._data[head];
            if (tail) {
                // recursively resolve xo
                if (object instanceof Xo) {
                    return object.resolve(tail);
                }
                // return value of native object / array (Array.prototype === Object)
                if (object instanceof Object) {
                    return object[tail];
                }
                // return null (path is invalid)
                return null;
            }
            // return whatever value is stored here
            return object;
        }
        return this;
    }

    /**
     * Resolves the data field of the path head and returns its value. For a path of 'abc.def.2.ghi',
     * its head 'abc.def.2' will be recursively resolved, leaving its tail 'ghi' excluded.
     * @param path Path to the data field
     * @param recursively Determines whether to recursively resolve all but the last part of path (true), or just the first part of path (false)
     * @return Head string, tail string and value of data field of the path head or NULL, if path head could not be resolved
     */
    resolveHead(path: string, recursively = true): {value: any; head: string; tail: string} {
        const idx = recursively ? path.lastIndexOf('.') : path.indexOf('.');
        const head = path.substring(0, idx);
        const tail = path.substring(idx + 1);
        return {value: this.resolve(head), head: head, tail: tail};
    }

    /**
     * Resolves a data field and assigns a new value to it
     * @param path Path to the data field
     * @param value Value to assign
     */
    resolveAssign(path: string, value: any) {
        const resolved = this.resolveHead(path);
        if (resolved.value instanceof Xo) {
            resolved.value.assign(resolved.tail, value);
        } else if (resolved.value instanceof Array) {
            const i = Number(resolved.tail);
            if (!isNaN(i)) {
                resolved.value[i] = value;
            }
        } else if (resolved.value instanceof Object) {
            resolved.value[resolved.tail] = value;
        }
    }

    /**
     * Resolves a data field and deletes it from the xo
     * @param path Path to the data field
     */
    resolveDelete(path: string) {
        const resolved = this.resolveHead(path);
        if (resolved.value instanceof Xo) {
            resolved.value.delete(resolved.tail);
        } else if (resolved.value instanceof Array) {
            const i = Number(resolved.tail);
            if (!isNaN(i)) {
                resolved.value.splice(i, 1);
            }
        } else if (resolved.value instanceof Object) {
            delete resolved.value[resolved.tail];
        }
    }

    /**
     * Resolves a data field while creating nested xo classes on the way
     * @param path Path to the data field
     * @return Resolved xo or NULL
     */
    resolveCreate(path: string): Xo {
        const resolved = this.resolveHead(path, false);
        if (resolved.value instanceof Xo) {
            return resolved.head
                ? this.resolveCreate(resolved.tail)
                : resolved.value;
        }
        const recursion = (clazz: XoClassInterface) => clazz
            ? this.assign(resolved.head, new clazz(resolved.head)).resolveCreate(resolved.tail)
            : null;
        if (this instanceof Xo.XoObject) {
            return recursion(this.properties.get(resolved.head));
        }
        if (this instanceof Xo.XoArray) {
            return recursion(this.decoratorClass.genericClass);
        }
        return null;
    }

    /**
     * Returns a list with all recursively determined describers within the xo
     * @param unique Determines whether to remove duplicates from the resulting list
     * @returns List of describers
     */
    abstract getDescribers(unique?: boolean): XoDescriber[];

    /**
     * Assigns a new value to a property or entry of the xo. In case of an xo array, the name
     * is the index of the entry to assign. This method can be used for chaining.
     * @param ident Identifying property name or index within XoObject or XoArray, respectively
     * @param value New value
     * @returns Xo
     */
    abstract assign(ident: any, value: any): this;

    /**
     * Deletes a property or entry from the xo. In case of an xo array, the name is the index
     * of the entry to delete. This method can be used for chaining.
     * @param ident Identifying property name or index within XoObject or XoArray, respectively
     * @returns Xo
     */
    abstract delete(ident: any): this;

    /**
     * Deletes all properties or entries from the xo. This method can be used for chaining.
     * @returns Xo
     */
    abstract clear(): this;

    /**
     * Actual object or array storing the xo data
     * @returns Data
     */
    abstract get data(): any;

    /**
     * Returns the identifier of the xo set during its creation
     * @returns Xo identifier (used in exported filename for example)
     */
    get ident(): string {
        return this._ident;
    }

    /**
     * Returns the runtime context of the xo. This getter is redeclared in the XoObjectClass and
     * XoArrayClass decorators to return the static property fallback set by their factory methods.
     * @returns Runtime context
     */
    get rtc(): RuntimeContext {
        return this._rtc;
    }

    /**
     * Sets the runtime context of the xo. This setter is redeclared in the XoObjectClass and
     * XoArrayClass decorators as well.
     * @param value Runtime context to set
     */
    set rtc(value: RuntimeContext) {
        this._rtc = value;
    }

    /**
     * Returns the full qualified name of the xo. This getter is redeclared in the XoObjectClass and
     * XoArrayClass decorators to return the static property fallback set by their factory methods.
     * @returns Full qualified name
     */
    get fqn(): FullQualifiedName {
        return this._fqn;
    }

    /**
     * Sets the full qualified name of the xo. This setter is redeclared in the XoObjectClass and
     * XoArrayClass decorators as well.
     * @param value Full qualified name to set
     */
    set fqn(value: FullQualifiedName) {
        this._fqn = value;
    }

    /**
     * List of classes that are derived from this class
     * @returns Class list
     */
    get derivedClasses(): ReadonlyMap<string, XoClassInterface> {
        // overwritten by XoObject and XoArray
        return null;
    }

    /**
     * Get the decorator class of the xo object, if any
     * @returns Decorator class
     */
    get decoratorClass(): XoClassInterface {
        // overwritten by XoObject and XoArray
        return null;
    }
}


///////////////////////////////////////////////////////////////////////////////
//  ACCESSOR, PROPERTY BINDINGS & WRAPPERS
///////////////////////////////////////////////////////////////////////////////


export type XoAccessor<T extends XoObject, U = any> = (t: T) => U;


export type XoAccessorMap<T extends XoObject = XoObject> = {
    [K in TypeFilterOut<keyof T, keyof XoObject | TypePropertiesOf<T, Function>>]: T[K] extends XoObject
        ? XoAccessorMap<T[K]>
        : string
};


export const XoAccessorMapPropertySeparator = '.';


export function XoAccessorPropertyMap<T extends XoObjectClassInterface>(clazz: T, prefix = '', accessorMap = {}): XoAccessorMap {
    new clazz().properties.forEach((value, key) =>
        accessorMap[key] = (value && value.rootClass === Xo.XoObject)
            ? XoAccessorPropertyMap(<XoObjectClassInterface>value, prefix + key + XoAccessorMapPropertySeparator)
            : prefix + key
    );
    if (prefix) {
        accessorMap[XoAccessorMapPropertySeparator] = prefix.substr(0, prefix.length - 1);
    }
    return accessorMap;
}


export interface XoPropertyBinding<T extends XoObject, U = any> {
    instance: T;
    accessor: XoAccessor<T, U>;
}


// eslint-disable-next-line @typescript-eslint/no-redeclare
export function XoPropertyBinding<T extends XoObject, U = any>(instance: T, accessor: XoAccessor<T, U>): XoPropertyBinding<T, U> {
    return {
        instance: instance,
        accessor: accessor
    };
}


export interface XoPendingPropertyValue<U = any> {
    assign: (value: U) => U;
    drop: () => U;
    keep: () => U;
    currentValue: U;
    pendingValue: U;
}


export class XoWrapper<C extends Native = any, M extends Native = any> {
    constructor(
        readonly wrap:   (value: M) => C,
        readonly unwrap: (value: C) => M
    ) {
    }
}


export const XoUnboxedInteger = new XoWrapper<string, number>(unboxedNumberToString,   stringToUnboxedInteger);
export const XoBoxedInteger   = new XoWrapper<string, number>(boxedNumberToString,     stringToBoxedInteger);

export const XoUnboxedFloat   = new XoWrapper<string, number>(unboxedNumberToString,   stringToUnboxedFloat);
export const XoBoxedFloat     = new XoWrapper<string, number>(boxedNumberToString,     stringToBoxedFloat);

export const XoUnboxedBoolean = new XoWrapper<string, boolean>(unboxedBooleanToString, stringToUnboxedBoolean);
export const XoBoxedBoolean   = new XoWrapper<string, boolean>(boxedBooleanToString,   stringToBoxedBoolean);


///////////////////////////////////////////////////////////////////////////////
//  XO OBJECT
///////////////////////////////////////////////////////////////////////////////


export class XoObject extends Xo {

    static readonly instance = new XoObject();

    /**
     * Returns the generic accessor map this xo class (typesafe workaround for polymorphic static this)
     * @returns Accessor map
     * @see https://github.com/Microsoft/TypeScript/issues/5863
     */
    static getAccessorMap<I extends typeof XoObject>(this: I): XoAccessorMap<InstanceType<I>> {
        // overwritten by XoObjectClass decorator
        return null;
    }

    /**
     * Returns the map with asynchronous subjects carrying additional information of the xo properties,
     * like its assignable values for enumerated xo properties
     * @returns Async map
     */
    static getAsyncMap<I>(): ReadonlyMap<string, Subject<I>> {
        // overwritten by XoObjectClass decorator
        return null;
    }

    /** Needed to comply with XoObjectClass inside XoObjectClassDecorator */
    static readonly derivedClasses: ReadonlyMap<string, XoObjectClassInterface> = new Map();

    /** Needed to comply with XoObjectClass inside XoObjectClassDecorator */
    static readonly rootClass = XoObject;

    /** Map containing pending property values used when encoding the xo object */
    protected readonly pendingPropertyValues = new Set<XoPendingPropertyValue>();

    /**
     * @inheritDoc
     */
    protected defaultData(): object {
        return {};
    }

    /**
     * @inheritDoc
     */
    protected decodeData(from: any): void {
        Object.keys(from)
            // don't decode transient or meta data
            .filter(key => !this.transientProperties.has(key) && !key.startsWith('$'))
            .forEach(key => this.data[key] = this.decodeSubData(from[key], key));
    }

    /**
     * @inheritDoc
     */
    protected encodeData(into: any): void {
        // assign pending property values
        this.pendingPropertyValues.forEach(ppv => ppv.assign(ppv.pendingValue));
        // encode data
        Object.keys(this.data)
            // don't encode transient and null/undefined data
            .filter(key => !this.transientProperties.has(key) && this.data[key] != null)
            .forEach(key => into[key] = this.encodeSubData(this.data[key]));
        // revert assignment of pending property values
        this.pendingPropertyValues.forEach(ppv => ppv.assign(ppv.currentValue));
    }

    /**
     * @inheritDoc
     */
    protected getBaseClass(ident: string): XoClassInterface {
        return this.properties.get(ident) ??
            // try again with sanitized key (e. g. removing a $ sign)
            this.properties.get(
                Array.from(this.properties.keys()).find(key =>
                    XoSanitizePropertyKey(key) === ident
                )
            );
    }

    /**
     * @inheritDoc
     */
    getDescribers(unique = true): XoDescriber[] {
        const describers = new Array<XoDescriber>({
            fqn: this.fqn,
            rtc: this.rtc,
            ident: this.ident
        });
        this.properties.forEach((value, key) =>
            describers.push(...(value && this[key] ? this[key].getDescribers(false) : []))
        );
        return unique ? uniquify(describers, XoDescriberString) : describers;
    }

    /**
     * @inheritDoc
     */
    assign(ident: any, value: any): this {
        this.data[ident] = value;
        return this;
    }

    /**
     * @inheritDoc
     */
    delete(ident: any): this {
        delete this.data[ident];
        return this;
    }

    /**
     * @inheritDoc
     */
    clear(): this {
        for (const ident in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, ident)) {
                delete this.data[ident];
            }
        }
        return this;
    }

    /**
     * Create a pending property value used when encoding the xo object
     * @param accessor Accessor of the property
     * @param pendingValueCallback Callback that must return the pending value for the property
     * @return Pending property value
     */
    createPendingPropertyValue<U = any>(accessor: XoAccessor<this, U>, pendingValueCallback: (currentValue: U) => U): XoPendingPropertyValue<U> {
        const propertyPaths: any = this.decoratorClass.getAccessorMap();
        const propertyPath:  any = accessor(propertyPaths);
        const head = isObject(propertyPath)
            ? {value: this, tail: propertyPath[XoAccessorMapPropertySeparator], head: ''}
            : this.resolveHead(propertyPath);
        if (head) {
            const propertyHost = head.value;
            const propertyName = head.tail;
            if (propertyHost instanceof XoObject && propertyName) {
                const currentValue = propertyHost[propertyName];
                const pendingValue = pendingValueCallback(currentValue);
                const pendingPropertyValue: XoPendingPropertyValue<U> = {
                    get currentValue() { return currentValue; },
                    get pendingValue() { return pendingValue; },
                    assign: value => propertyHost[propertyName] = value,
                    drop: () => {
                        this.pendingPropertyValues.delete(pendingPropertyValue);
                        return currentValue;
                    },
                    keep: () => {
                        this.pendingPropertyValues.delete(pendingPropertyValue);
                        return pendingPropertyValue.assign(pendingValue);
                    }
                };
                this.pendingPropertyValues.add(pendingPropertyValue);
                return pendingPropertyValue;
            }
        }
    }

    /**
     * Clears all pending property values
     */
    clearPendingPropertyValues() {
        this.pendingPropertyValues.clear();
    }

    /**
     * Creates a proxy (essentially a clone) of the xo object that contains only its unique properties
     * and those properties directly targeted by the given accessors
     * @param accessors Accessors of the properties to be included in the proxy
     * @returns Proxy
     */
    proxy(accessors?: XoAccessor<this, any>[]): this {
        // create undefined pending property values for all non-transient, non-unique properties
        const ppvsUndefined = Array.from(this.properties.keys())
            .filter(key => !this.transientProperties.has(key) && !this.uniqueProperties.has(key))
            .map(key => this.createPendingPropertyValue(t => t[key], () => undefined))
            .filter(ppv => !!ppv);
        // create overwrite pending property values for all accessors
        const ppvsOverwrite = (accessors ?? [])
            .map(accessor => this.createPendingPropertyValue<any>(accessor, value => value))
            .filter(ppv => !!ppv);
        // clone with pending properties
        const proxy = this.clone();
        // drop pending property values again
        ppvsUndefined.forEach(ppv => ppv.drop());
        ppvsOverwrite.forEach(ppv => ppv.drop());
        return proxy;
    }

    /**
     * Unique key of the xo object by joining all its unique properties
     * @returns Unique key
     */
    get uniqueKey(): string {
        return Array.from(this.uniqueProperties.keys())
            .map(key   => this[key])
            .map(value => value instanceof Comparable ? value.uniqueKey : value)
            .join(',');
    }

    /**
     * Actual javascript object containing the values of the xo properties
     * @returns Data object
     */
    get data(): object {
        return this._data;
    }

    /**
     * Map with names of all xo properties and their specific xo class, if any
     * @returns Property map
     */
    get properties(): ReadonlyMap<string, XoObjectClassInterface | XoArrayClassInterface> {
        // overwritten by XoProperty decorator
        return new Map();
    }

    /**
     * Map with names of all enumerated xo properties
     * @returns Enumerated property map
     */
    get enumeratedProperties(): ReadonlyMap<string, Observable<NativeArray>> {
        // overwritten by XoEnumerated decorator
        return new Map();
    }

    /**
     * Map with names of all wrapped xo properties
     * @returns Wrapped property map
     */
    get wrappedProperties(): ReadonlyMap<string, XoWrapper> {
        // overwritten by XoWrapped decorator
        return new Map();
    }

    /**
     * Set with names of all transient xo properties
     * @returns Transient property name set
     */
    get transientProperties(): ReadonlySet<string> {
        // overwritten by XoTransient decorator
        return new Set();
    }

    /**
     * Set with names of all readonly xo properties
     * @returns Readonly property name set
     */
    get readonlyProperties(): ReadonlySet<string> {
        // overwritten by XoReadonly decorator
        return new Set();
    }

    /**
     * Set with names of all unique xo properties
     * @returns Unique property name set
     */
    get uniqueProperties(): ReadonlySet<string> {
        // overwritten by XoUnique decorator
        return new Set();
    }

    /**
     * Set with names of all i18n xo properties
     * @returns I18n property name set
     */
    get i18nProperties(): ReadonlySet<string> {
        // overwritten by XoI18n decorator
        return new Set();
    }

    /**
     * List of classes that are derived from this class
     * @returns Class list
     */
    get derivedClasses(): ReadonlyMap<string, XoObjectClassInterface> {
        // overwritten by XoObjectClass decorator
        return null;
    }

    /**
     * Get the decorator class of the xo object, if any
     * @returns Decorator class
     */
    get decoratorClass(): XoObjectClassInterface {
        // overwritten by XoObjectClass decorator
        return null;
    }
}


///////////////////////////////////////////////////////////////////////////////
//  XO ARRAY
///////////////////////////////////////////////////////////////////////////////


export class XoArray<T extends Xo = Xo> extends Xo {

    static readonly instance = new XoArray();

    /** Needed to comply with XoArrayClass inside XoArrayClassDecorator */
    static readonly genericClass: XoObjectClassInterface = XoObject;

    /** Needed to comply with XoArrayClass inside XoArrayClassDecorator */
    static readonly derivedClasses: ReadonlyMap<string, XoArrayClassInterface> = new Map();

    /** Needed to comply with XoArrayClass inside XoArrayClassDecorator */
    static readonly rootClass = XoArray;

    /**
     * @inheritDoc
     */
    protected defaultData(): T[] {
        return [];
    }

    /**
     * @inheritDoc
     */
    protected decodeData(from: any): void {
        this.data.splice(this.length, 0, ...from.$list.map(
            (value: any, idx: number) => this.decodeSubData(value, String(idx))
        ));
    }

    /**
     * @inheritDoc
     */
    protected encodeData(into: any): void {
        into.$list = this.data.map(
            value => this.encodeSubData(value)
        );
    }

    /**
     * @inheritDoc
     */
    protected getBaseClass(ident: string): XoClassInterface {
        return this.genericClass;
    }

    /**
     * @inheritDoc
     */
    getDescribers(unique = true): XoDescriber[] {
        const describers = new Array<XoDescriber>();
        this.data.forEach(value =>
            describers.push(...(value ? value.getDescribers(false) : []))
        );
        return unique ? uniquify(describers, XoDescriberString) : describers;
    }

    /**
     * @inheritDoc
     */
    assign(ident: any, value: any): this {
        const idx = Number(ident);
        if (!isNaN(idx)) {
            this.data[idx] = value;
        }
        return this;
    }

    /**
     * @inheritDoc
     */
    delete(ident: any): this {
        const idx = Number(ident);
        if (!isNaN(idx)) {
            this.data.splice(idx, 1);
        }
        return this;
    }

    /**
     * @inheritDoc
     */
    clear(): this {
        this.data.splice(0);
        return this;
    }

    /**
     * Appends entries to the xo array. This method can be used for chaining.
     * @param values Values to append
     * @returns Xo
     */
    append(...values: T[]): this {
        this.data.push(...values);
        return this;
    }

    /**
     * Removes entries from the xo array. This method can be used for chaining.
     * @param values Values to Remove
     * @returns Xo
     */
    remove(...values: T[]): this {
        values.forEach(value => {
            const idx = this.data.indexOf(value);
            if (idx >= 0) {
                this.data.splice(idx, 1);
            }
        });
        return this;
    }

    /**
     * Default iterator implementation to iterate over the xo array
     * @returns Iterator
     */
    *[Symbol.iterator](): IterableIterator<T> {
        for (const value of this.data) {
            yield value;
        }
    }

    /**
     * Unique key of the xo array by joining the unique keys of all its entries
     * @returns Unique key
     */
    get uniqueKey(): string {
        return this.data.map(value => value.uniqueKey).join(';');
    }

    /**
     * Actual javascript array containing the values of the xo array
     * @returns Data array
     */
    get data(): T[] {
        return this._data;
    }

    /**
     * Number of values of the xo array
     * @returns Length of the data array
     */
    get length(): number {
        return this.data.length;
    }

    /**
     * Class, entries of the xo array must be derived from
     * @returns Class
     * @see XoArrayClass decorator
     */
    get genericClass(): XoObjectClassInterface {
        // overwritten by XoArrayClass decorator
        return null;
    }

    /**
     * List of classes that are derived from this class
     * @returns Class list
     */
    get derivedClasses(): ReadonlyMap<string, XoArrayClassInterface> {
        // overwritten by XoArrayClass decorator
        return null;
    }

    /**
     * Get the decorator class of the xo array, if any
     * @returns Decorator class
     */
    get decoratorClass(): XoArrayClassInterface {
        // overwritten by XoArrayClass decorator
        return null;
    }
}


/**
 * Avoid circular dependencies by assigning subclasses here
 * Remark: Must be wrapped in a function. Otherwise, it won't be called during an AOT build
 */
(() => {
    Xo.XoObject = XoObject;
    Xo.XoArray  = XoArray;
})();


export function XoClassInterfaceFrom(from: XoJson): XoObjectClassInterface | XoArrayClassInterface {
    if (isObject(from) && isObject(from.$meta)) {
        return !isArray(from.$list)
            ? XoObject
            : XoArray;
    }
    return null;
}


export function XoDerivedClassInterfaceFrom(from: XoJson): XoObjectClassInterface | XoArrayClassInterface {
    if (isObject(from) && isObject(from.$meta)) {
        return !isArray(from.$list)
            ? XoObject.instance.getDerivedClass(undefined, FullQualifiedName.decode(from.$meta.fqn)) as XoObjectClassInterface ?? XoObject
            :  XoArray.instance.getDerivedClass(undefined, FullQualifiedName.decode(from.$meta.fqn)) as XoArrayClassInterface  ?? XoArray;
    }
    return null;
}
