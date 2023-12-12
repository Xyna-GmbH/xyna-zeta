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
import { Comparable, isObject, isString } from '../../base';


export interface Workspace {
    workspace: string;
}


export interface ApplicationVersion {
    application: string;
    version: string;
}


export interface ApplicationConstraints {
    minVersion?: string;
    maxVersion?: string;
}


export class RuntimeContext extends Comparable {
    static readonly SEPARATOR = '%252F';

    static readonly defaultWorkspace   = RuntimeContext.fromWorkspace('default workspace');
    static readonly zetaApplication    = RuntimeContext.fromApplication('ZetaFramework');
    static readonly guiHttpApplication = RuntimeContext.fromApplication('GuiHttp');
    static readonly undefined          = new RuntimeContext(undefined, undefined);


    /**
     * Workspace
     * @param workspace Workspace name
     */
    static fromWorkspace(workspace: string): RuntimeContext {
        return new RuntimeContext({workspace}, undefined);
    }


    /**
     * Application with a specific Version
     * @param application Application name
     * @param version     Version name
     */
    static fromApplicationVersion(application: string, version: string): RuntimeContext {
        return new RuntimeContext(undefined, {application, version});
    }


    /**
     * Application with the newest version
     * @param application Application name
     */
    static fromApplication(application: string): RuntimeContext {
        return RuntimeContext.fromApplicationVersion(application, '');
    }


    static decode(json: any): RuntimeContext {
        if (isObject(json)) {
            if (isString(json.workspace)) {
                return RuntimeContext.fromWorkspace(json.workspace);
            }
            if (isString(json.application)) {
                return isString(json.version)
                    ? RuntimeContext.fromApplicationVersion(json.application, json.version)
                    : RuntimeContext.fromApplication(json.application);
            }
            return RuntimeContext.undefined;
        }
        return null;
    }


    private constructor(
        readonly ws?: Workspace,
        readonly av?: ApplicationVersion
    ) {
        super();
    }


    encode(): any {
        if (this.ws) {
            return this.ws;
        }
        if (this.av) {
            return this.av;
        }
        return {};
    }


    toLabel(): string {
        if (this.ws) {
            return `Workspace: ${this.ws.workspace}`;
        }
        if (this.av) {
            return `Application: ${this.av.application}, Version: ${this.av.version}`;
        }
        return '';
    }


    toString(): string {
        return 'RTC(' + this.toLabel() + ')';
    }


    get uniqueKey(): string {
        if (this.ws) {
            return this.ws.workspace;
        }
        if (this.av) {
            return [this.av.application, this.av.version].join(RuntimeContext.SEPARATOR);
        }
        return '';
    }
}


export class FullQualifiedName extends Comparable {
    static readonly SEPARATOR = '.';    // separates tokens inside path and path from name
    static readonly ANCHOR = '#';       // used after _name_ to specify an object inside the document behind this FQN

    static readonly boolean   = FullQualifiedName.fromPrimitive('boolean');
    static readonly Boolean   = FullQualifiedName.fromPrimitive('Boolean');
    static readonly int       = FullQualifiedName.fromPrimitive('int');
    static readonly Integer   = FullQualifiedName.fromPrimitive('Integer');
    static readonly long      = FullQualifiedName.fromPrimitive('long');
    static readonly Long      = FullQualifiedName.fromPrimitive('Long');
    static readonly double    = FullQualifiedName.fromPrimitive('double');
    static readonly Double    = FullQualifiedName.fromPrimitive('Double');
    static readonly String    = FullQualifiedName.fromPrimitive('String');
    static readonly undefined = new FullQualifiedName(undefined, undefined);


    static fromPathName(path: string, name: string, anchor?: string): FullQualifiedName {
        return name
            ? new FullQualifiedName(path, name, anchor)
            : null;
    }


    static fromPrimitive(name: string): FullQualifiedName {
        return this.fromPathName(undefined, name);
    }


    static decode(pathAndName: string): FullQualifiedName {
        if (pathAndName) {
            const separatorIdx = pathAndName.lastIndexOf(FullQualifiedName.SEPARATOR);
            const path = pathAndName.substring(0, separatorIdx);
            const name = pathAndName.substring(separatorIdx + 1);
            const anchorIdx = name.lastIndexOf(FullQualifiedName.ANCHOR);
            const anchor = anchorIdx >= 0
                ? this.name.substring(anchorIdx + 1)
                : undefined;
            return FullQualifiedName.fromPathName(path, name, anchor);
        }
        return null;
    }


    constructor(
        readonly path = '',
        readonly name = '',
        readonly anchor?: string
    ) {
        super();
    }


    encode(withAnchor = true): string {
        const anchorString = this.anchor && withAnchor
            ? FullQualifiedName.ANCHOR + this.anchor
            : '';
        return !this.isPrimitive()
            ? [this.path, this.name].join(FullQualifiedName.SEPARATOR) + anchorString
            : this.name + anchorString;
    }


    toLabel(): string {
        const anchorString = this.anchor
            ? `, Anchor:${this.anchor}`
            : '';
        return this.path
            ? `Path:${this.path}, Name:${this.name}` + anchorString
            : `Name:${this.name}` + anchorString;
    }


    toString(): string {
        return 'FQN(' + this.toLabel() + ')';
    }


    isPrimitive(): boolean {
        return !this.path;
    }


    isNullablePrimitive(): boolean {
        return FullQualifiedName.Boolean.equals(this) ||
               FullQualifiedName.Integer.equals(this) ||
               FullQualifiedName.Long.equals(this)    ||
               FullQualifiedName.Double.equals(this)  ||
               FullQualifiedName.String.equals(this);
    }


    isNumericPrimitive(): boolean {
        return this.intLike || this.floatLike;
    }


    get boolLike(): boolean {
        return FullQualifiedName.boolean.equals(this) || FullQualifiedName.Boolean.equals(this);
    }


    get intLike(): boolean {
        return FullQualifiedName.int.equals(this)  || FullQualifiedName.Integer.equals(this) ||
               FullQualifiedName.long.equals(this) || FullQualifiedName.Long.equals(this);
    }


    get floatLike(): boolean {
        return FullQualifiedName.double.equals(this) || FullQualifiedName.Double.equals(this);
    }


    get stringLike(): boolean {
        return FullQualifiedName.String.equals(this);
    }


    get uniqueKey(): string {
        return this.encode();
    }


    /**
     * @inheritdoc
     *
     * @param that Object to compare this object to
     * @param considerAnchor If _true_, also compares _anchor_ fields. Default is _true_
     * @returns TRUE, if this object equals the other object, FALSE otherwise
     */
    equals(that: this, considerAnchor = true): boolean {
        return that?.encode(considerAnchor) === this.encode(considerAnchor);
    }
}


export interface XoDescriber {
    rtc?: RuntimeContext;
    fqn?: FullQualifiedName;
    ident?: string;
}


export function XoDescriberString(describer: XoDescriber, fallbackRtc: RuntimeContext = RuntimeContext.undefined): string {
    return (describer.rtc || fallbackRtc).uniqueKey + '/' + describer.fqn.uniqueKey;
}
