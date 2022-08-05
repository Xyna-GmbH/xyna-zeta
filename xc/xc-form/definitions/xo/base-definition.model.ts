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
import { ValidatorFn } from '@angular/forms';

import { BehaviorSubject, Observable, of, PartialObserver } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

import { Xo, XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '../../../../api';
import { XoXPRCRuntimeContext } from '../../../../api/xo/runtime-context.model';
import { XcStackItemInterface } from '../../../xc-stack/xc-stack-item/xc-stack-item';
import { XcTableDataSource } from '../../../xc-table/xc-table-data-source';
import { XcTemplate } from '../../../xc-template/xc-template';
import { XcDefinitionComponentTemplate } from '../shared/xc-definition-component-template.component';
import { XoComponentDefinition, XoStartOrderButtonDefinition } from './item-definition.model';


export interface XoDefinitionBundle {
    definition: XoDefinition;
    data: Xo[];
}


export class EncodableDefinitionBundle implements XoDefinitionBundle {
    constructor(public definition: XoDefinition, public data: Xo[], public constraintId?: string) {
    }


    encode(): string {
        const definitionJSON = JSON.stringify(this.definition.encode());
        const resolvedDataJSON = JSON.stringify((this.data[0] ?? new XoObject()).encode());
        return '{' +
                `"definition":${definitionJSON}` +
                `,"data":${resolvedDataJSON}` +
                (this.constraintId ? `,"constraint":"${this.constraintId}"` : '') +
            '}';
    }
}


export interface XoComponentDefinitionData extends XoDefinitionBundle {
    definition: XoComponentDefinition;
    resolvedData: any[];
}


export interface XoCloseDefinitionData extends XoDefinitionBundle {
    refreshParentDefinition?: boolean;
    reopenAfterRefresh?: boolean;
    force?: boolean;
}


export interface XoDefinitionObserver {
    getComponent?(componentName: string): XcDefinitionComponentTemplate<XoComponentDefinitionData>;
    getValidator?(validatorName: string): ValidatorFn;
    openDefinition?(definition: XoBaseDefinition, data: Xo[]): Observable<XcStackItemInterface>;
    closeDefinition?(data?: XoCloseDefinitionData): Observable<boolean>;
    definitionClosed?(): Observable<XoCloseDefinitionData>;
    resolveDefinition?(definitionWorkflowRTC: XoXPRCRuntimeContext, definitionWorkflowFQN: string, data: Xo[]): Observable<XoDefinitionBundle>;
    getDefaultRTC?(): XoXPRCRuntimeContext;
    startOrder?(definition: XoStartOrderButtonDefinition, input: Xo | Xo[]): Observable<Xo | Xo[]>;
    translate?(value: string): string;
    afterSetObserver?(definition: XoDefinition);
}



@XoObjectClass(null, 'xmcp.forms.datatypes', 'Definition')
export class XoDefinition extends XoObject {

    /**
     * Comma separated list with data paths (relative or absolute)
     * Don't use to access data. Always use getters
     */
    @XoProperty()
    dataPath = '';

    private _parent: XoDefinition;
    private readonly _children: XoDefinition[] = [];
    private readonly _definitionObserverSubject = new BehaviorSubject<XoDefinitionObserver>(null);

    /**
     * List of absolute paths, resolved from comma separated list.
     * All paths start with `%n%`, where `n` defines the nth entry in the `Xo` list
     */
    private _dataPaths: string[];

    private _dirty = false;

    private _resolutionBundle: EncodableDefinitionBundle;


    protected afterDecode() {
        super.afterDecode();
        this.postProcessPaths();
    }


    getParent(): XoDefinition {
        return this._parent;
    }


    setParent(parent: XoDefinition) {
        if (this._parent !== parent) {
            this._parent = parent;
            parent.addChild(this);
        }
        this.postProcessPaths();
    }


    protected addChild(child: XoDefinition) {
        if (this._children.indexOf(child) < 0) {
            this._children.push(child);
            child.setParent(this);
        }
    }


    setDataChanged() {
        this._dirty = true;
    }


    hasDataChanges(): boolean {
        return this._dirty || !!this._children.find(child => child.hasDataChanges());
    }


    clearDataChangeState() {
        this._dirty = false;
        this._children.forEach(child => child.clearDataChangeState());
    }


    private postProcessPaths() {
        const join = (head: string, tail: string): string => {
            if (head && tail) {
                return head + '.' + tail;
            }
            return head || tail;
        };

        // split into path parts
        this._dataPaths = this.dataPath.split(',');

        /*
         * An empty dataPath means matching all the data (even an array of data).
         * In all other cases, the path parts are converted to absolute paths
         */
        if (this.dataPath.length > 0) {
            this._dataPaths = this._dataPaths.map(path => {
                path = path.trim();
                if (!path.startsWith('%') && this._parent) {
                    // make absolute by prepending parent paths
                    path = join(this._parent.getDataPath(), path);
                }
                // if now absolute path still doesn't start with an index, assume index 0
                if (!path.startsWith('%')) {
                    path = join('%0%', path);
                }
                return path;
            });
        }
    }


    private resolvePath(path: string): {index: number; relativePath: string} {
        const pathGroups = /^%(\d+)%(?:\.(.*))*/.exec(path);
        if (pathGroups && pathGroups.length > 2) {
            return { index: +pathGroups[1], relativePath: pathGroups[2] || '' };
        }
        return null;
    }


    /**
     * Resolves data object for each data path
     * @param data List of data to resolve data paths for
     * @return One resolved data object per data path
     */
    resolveData(data: Xo[]): any[] {
        if (!data || data.length === 0) {
            return [];
        }
        const resolvedData = [];
        this.getDataPaths().forEach(path => {
            if (!path) {
                // explicit empty path explicitly resolves to all the data
                resolvedData.push(...data);
            } else if (path === '%null%') {
                // explicit path %null% explicitly resolves to null
                resolvedData.push(null);
            } else if (path === '%%') {
                // explicit path %% explicitly doesn't resolve any data
                resolvedData.push();
            } else {
                // find index of data path
                const resolvedPath = this.resolvePath(path);
                if (resolvedPath && data.length > resolvedPath.index) {
                    resolvedData.push(data[resolvedPath.index]
                        ? data[resolvedPath.index].resolve(resolvedPath.relativePath)
                        : null
                    );
                } else {
                    resolvedData.push(null);
                    console.warn('XoBaseDefinition: Resolving data with invalid path: ' + path
                        + '\n  data:' + data.map((d, i) => '\n    ' + i + ': ' + JSON.stringify(d.encode()))
                    );
                }
            }
        });
        return resolvedData;
    }


    /**
     * Resolves data object for first data path
     * @param data List of data to resolve first data path for
     * @return Resolved data object for first data path
     */
    resolveDataForFirstPath(data: Xo[]): any {
        return this.resolveData(data)[0] || null;
    }


    /**
     * Assigns value for data object belonging to first data path
     * @param data List of data to resolve assign first data paths for
     * @param value Value to set along first data path
     */
    protected resolveAssignData(data: Xo[], value: any) {
        // don't consider "undefined -> ''" or "null -> undefined" as change
        const reduce = (v: any): any => v === null || v === undefined || v === '' ? undefined : v;

        const resolvedPath = this.resolvePath(this.getDataPath());
        if (resolvedPath && data.length > resolvedPath.index) {
            if (reduce(this.resolveDataForFirstPath(data)) !== reduce(value)) {
                data[resolvedPath.index].resolveAssign(resolvedPath.relativePath, value);
                this.setDataChanged();
            }
        } else {
            console.warn('XoBaseDefinition: Assigning value for invalid path: ' + this.getDataPath() + '\nvalue: ' + value);
        }
    }


    /**
     * Prunes given data such that it only contains info needed by _dataPath_
     * @param data Data to be pruned
     */
    protected pruneData(data: Xo[]): Xo[] {
        if (this.dataPath) {
            const resolvedPaths = this.getDataPaths().map(path => this.resolvePath(path));
            const prunedData: Xo[] = data.map(d => d.clone());
            prunedData.forEach((d: Xo, index: number) => {
                for (const key in d.data) {
                    if (Object.prototype.hasOwnProperty.call(d.data, key)) {
                        const matches = resolvedPaths.filter(path =>
                            !path || path.index === index && path.relativePath.startsWith(key)
                        );
                        if (!matches || matches.length === 0) {
                            delete d.data[key];
                        }
                    }
                }
            });
            return prunedData;
        }
        return data;
    }


    /**
     * Returns first data path or '', if none
     */
    getDataPath(): string {
        return this.getDataPaths().length > 0 ? this.getDataPaths()[0] : '';
    }


    /**
     * Returns all data paths
     */
    getDataPaths(): string[] {
        return this._dataPaths;
    }


    get observer(): XoDefinitionObserver {
        return this._definitionObserverSubject.value;
    }


    setObserver(value: XoDefinitionObserver) {
        this._definitionObserverSubject.next(value);
        if (this.observer && this.observer.afterSetObserver) {
            this.observer.afterSetObserver(this);
        }
    }


    get observerChange(): Observable<XoDefinitionObserver> {
        return this._definitionObserverSubject.asObservable();
    }


    protected get parent(): XoDefinition {
        return this._parent;
    }


    protected translate(value: string): Observable<string> {
        return this.observerChange.pipe(
            filter(observer => !!observer),
            map(observer => observer.translate?.(value))
        );
    }


    /**
     * @returns Data source of a table, if there is one in scope of this definition, returns *null* otherwise
     */
    getTableDataSource(): XcTableDataSource {
        return this.parent ? this.parent.getTableDataSource() : null;
    }


    /**
     * @returns All validators in scope of this definition
     */
    getValidators(): ValidatorFn[] {
        return [];
    }


    resolveDefinition(data: Xo[]): Observable<XoDefinitionBundle> {
        return of(null);
    }


    /**
     * @returns Bundle, this definition is generated by (usually by a Definition Workflow). Null, if not created by a bundle
     * @remark If this definition was not created via a bundle itself, but a parent was, the bundle of a parent is returned instead,
     * while a constraint for this definition's ident is set.
     */
    getResolutionBundle(): EncodableDefinitionBundle {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let definition: XoDefinition = this;
        while (definition && !definition._resolutionBundle) {
            definition = definition.getParent();
        }
        return !definition || definition === this
            ? definition?._resolutionBundle
            : new EncodableDefinitionBundle(definition._resolutionBundle?.definition, definition._resolutionBundle?.data, this.ident);
    }


    setResolutionBundle(bundle: EncodableDefinitionBundle) {
        this._resolutionBundle = bundle;
    }
}


@XoArrayClass(XoDefinition)
export class XoDefinitionArray extends XoArray<XoDefinition> {
}



/***********************************************
 * BASE DEFINITION
 **********************************************/

@XoObjectClass(XoDefinition, 'xmcp.forms.datatypes', 'BaseDefinition')
export class XoBaseDefinition extends XoDefinition {

    @XoProperty()
    label = '';

    @XoProperty()
    hidden = false;

    @XoProperty()
    disabled = false;

    @XoProperty()
    hideIfEmpty = false;

    @XoProperty()
    hideIfUndefined = false;

    @XoProperty()
    style = '';


    /**
     * Returns template for data
     * @param data The **unresolved** (!) data. Has to be resolved inside the method to get the actual data
     * Remark: Cannot pass resolved data, because resolved data might be a primitive type. If a template only knows the
     * primitive type, it cannot write back an input value into the Xo
     */
    getTemplate(data: Xo[]): Observable<XcTemplate> {
        return null;
    }


    /**
     * Checks if the defined objects shall be visible for passed data
     *
     * Checks state for each data path - already hidden if hidden for at least one data path
     *
     * @param data The **unresolved** (!) data to check visibility for
     */
    isHiddenFor(data: Xo[]): boolean {
        const resolvedData = this.resolveData(data);
        return this.hidden
            || (resolvedData || []).filter(value => {
                const isUndefined = value === null || value === undefined;
                const isEmpty = isUndefined || (Object.prototype.hasOwnProperty.call(value.constructor, 'length') && value.length === 0);
                return this.hideIfEmpty && isEmpty || this.hideIfUndefined && isUndefined;
            }).length > 0
            && this.dataPath.length > 0;
    }


    resolveDefinition(data: Xo[]): Observable<XoDefinitionBundle> {
        return of({ definition: this, data: data });
    }
}


@XoArrayClass(XoBaseDefinition)
export class XoBaseDefinitionArray extends XoArray<XoBaseDefinition> {
}




/***********************************************
 * DEFINITION WORKFLOW
 **********************************************/

@XoObjectClass(XoDefinition, 'xmcp.forms.datatypes', 'DefinitionWorkflow')
export class XoDefinitionWorkflow extends XoDefinition {

    @XoProperty(XoXPRCRuntimeContext)
    $rTC: XoXPRCRuntimeContext;

    @XoProperty()
    $fQN = '';


    /**
     * A Definition Workflow resolves to the definition returned by it
     */
    resolveDefinition(data: Xo[]): Observable<XoDefinitionBundle> {
        if (this.observer && this.observer.resolveDefinition) {
            // let observer resolve the definition Workflow
            const resolvedData = this.resolveData(data);
            return this.observer.resolveDefinition(this.$rTC, this.$fQN, resolvedData).pipe(
                tap<XoDefinitionBundle>(<PartialObserver<XoDefinitionBundle>>{
                    next: bundle => {
                        // only store that data in bundle that is needed by the definition's data path
                        const prunedData = this.pruneData(data);
                        bundle.definition.setResolutionBundle(new EncodableDefinitionBundle(this, prunedData));
                    }
                })
            );
        }
        console.error('DefinitionWorkflow: Cannot resolve Workflow because the observer function is not defined.');
        return of(null);
    }
}


@XoArrayClass(XoDefinitionWorkflow)
export class XoDefinitionWorkflowArray extends XoArray<XoDefinitionWorkflow> {
}
