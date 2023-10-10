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
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService, RuntimeContext, XoArray, XoDescriberCache, XoObjectClass, XoStructureField, XoStructureMethod, XoStructureObject, XoStructurePrimitive } from '../../../api';
import { XcDynamicComponentType, XcTemplate } from '../../../xc';
import { XcTemplateFactory } from '../xc-template-factory';
import { XcContainerBaseTemplate, XoTemplateDefinedBase } from './template-container-base.model';
import { XcTemplateContainerComponent } from './xc-template-container.component';


export class XcContainerTemplate extends XcContainerBaseTemplate<XoTemplateDefinedBase> {
    /**
     * Backed templates
     */
    private childTemplates: XcTemplate[];

    /**
     * Backed structure
     */
    private childStructures: XoStructureField[] = [];
    private readonly structureCache = new XoDescriberCache<XoStructureObject>();
    private retrievingStructure: Observable<XoStructureObject> = null;  // is set if request is pending

    /**
     * Acceleration Structure
     * structure-field -> template
     * (this.childStructures) :- (this.childTemplates)
     */
    private readonly structureTemplates = new Map<XoStructureField, XcTemplate[]>();

    private invalidated = false;
    private readonly childTemplatesChangeSubject = new Subject<void>();


    constructor(component: XcDynamicComponentType<XoTemplateDefinedBase>, data: XoTemplateDefinedBase, protected apiService: ApiService, protected rtc: RuntimeContext) {
        super(component, data);
    }


    /**
     * Retrieves the structure fields of this template
     *
     * @returns Structure fields
     */
    private retrieveChildStructures(): Observable<XoStructureField[]> {
        const structure = this.data.getLocalStructure();
        if (structure) {
            return of(structure.children);
        }
        if (this.apiService && this.rtc) {
            // if retrieving is not pending, retrieve structure
            if (!this.retrievingStructure) {
                this.retrievingStructure = this.apiService.getStructure(this.rtc, [this.data], this.structureCache).get(this.data).pipe(
                    map(structureObject => {
                        structureObject.name = '';
                        this.retrievingStructure = null;
                        return structure;
                    })
                );
            }
            return this.retrievingStructure.pipe(map(s => s?.children));
        }
        console.warn('XoTemplateDefinedObject: No ApiService or Runtime Context defined to retrieve structure of Xo!');
        return of(null);
    }


    /**
     * Returns templates created out of this container's structure
     *
     * @remark When a Structure Field doesn't change, the template for it will also be reused.
     *
     * @returns Backed templates or new ones if no backed templates are available (e. g. because of invalidation)
     */
    getChildTemplates(): Observable<XcTemplate[]> {
        const createTemplatesFromFields = (fields: XoStructureField[]): XcTemplate[]  => {
            const templates = [];
            fields
                .filter(field => !(field instanceof XoStructureMethod))
                .forEach(field => {
                    let fieldTemplates = this.structureTemplates.get(field);
                    if (!fieldTemplates) {
                        fieldTemplates = this.createTemplatesForMember(field);
                        this.structureTemplates.set(field, fieldTemplates);
                    }
                    if (fieldTemplates.length === 0) {
                        console.log(`no rule to build a template for field "${field.path}"`);
                    }
                    templates.push(...fieldTemplates);
                });
            return templates;
        };

        if (!this.childTemplates || this.invalidated) {
            return this.retrieveChildStructures().pipe(
                map(fields => {
                    // compare new fields with backed ones
                    // only replace backed structure with new one, if it has changed
                    // --
                    // "fields" will be the new structure-list, so replace those instances by their matching backed ones
                    for (let i = 0; i < fields.length; i++) {
                        const backedIndex = this.childStructures.findIndex(backedStructure =>
                            backedStructure.equals(fields[i])
                        );
                        if (backedIndex >= 0) {
                            fields[i] = this.childStructures[backedIndex];
                            this.childStructures.splice(backedIndex, 1);
                        }
                    }

                    // fields left in "childStructures" are not used anymore, so remove from map
                    this.childStructures.forEach(child => {
                        this.structureTemplates.delete(child);
                    });
                    this.childStructures = fields;

                    // build up new templates-list
                    this.childTemplates = createTemplatesFromFields(this.childStructures);
                    this.invalidated = false;
                    return this.childTemplates;
                })
            );
        }
        return of(this.childTemplates);
    }


    invalidateChildTemplates() {
        if (this.childTemplates) {
            this.childTemplates
                .filter(child => child instanceof XcContainerTemplate)
                .forEach(child => (child as XcContainerTemplate).invalidateChildTemplates());
        }
        this.invalidated = true;
        this.childTemplatesChangeSubject.next();
    }


    /**
     * Instantiates the templates for one structure field
     *
     * Override to instantiate a custom template
     */
    protected createTemplatesForMember(field: XoStructureField): XcTemplate[] {
        const member = this.data.resolve(field.path);

        // primitive members
        if (field instanceof XoStructurePrimitive) {
            const templates = XcTemplateFactory.createTemplates(field, this.data);
            return templates;
        }

        // members, that are template containers itself
        if (member instanceof XoTemplateDefinedBase) {
            return [member.getTemplate()];
        }

        if (member instanceof XoArray) {
            return member.data
                .filter(entry => entry instanceof XoTemplateDefinedBase)
                .map(entry => entry.getTemplate());
        }

        return [];
    }


    childTemplatesChange(): Observable<void> {
        return this.childTemplatesChangeSubject.asObservable();
    }
}



@XoObjectClass(XoTemplateDefinedBase, 'xmcp.templates.datatypes', 'TemplateDefinedObject')
export class XoTemplateDefinedObject extends XoTemplateDefinedBase {
    private _template: XcContainerTemplate;
    private _apiService: ApiService;
    private _$rtc: RuntimeContext;

    private readonly childDefinitions: XoTemplateDefinedObject[] = [];


    getTemplate(): XcContainerTemplate {
        if (!this._template) {
            this._template = this.instantiateTemplate();
        }
        return this._template;
    }


    resetTemplate() {
        this._template = null;
    }


    /**
     * Instantiates the template that shall be used to display this Xo
     *
     * Override to instantiate a custom template
     */
    protected instantiateTemplate(): XcContainerTemplate {
        return new XcContainerTemplate(XcTemplateContainerComponent, this, this.apiService, this.$rtc);
    }


    protected updateChildDefinitions() {
        this.childDefinitions.forEach(definition => {
            definition.apiService = this.apiService;
            definition.$rtc = this.$rtc;
        });
    }


    addChildDefinition(definition: XoTemplateDefinedObject) {
        this.childDefinitions.push(definition);
    }


    removeChildDefinition(definition: XoTemplateDefinedObject) {
        const index = this.childDefinitions.indexOf(definition);
        if (index >= 0) {
            this.childDefinitions.splice(index, 1);
        }
    }


    get apiService(): ApiService {
        return this._apiService;
    }


    set apiService(value: ApiService) {
        this._apiService = value;
        this.updateChildDefinitions();
    }


    get $rtc(): RuntimeContext {
        return this._$rtc;
    }


    set $rtc(value: RuntimeContext) {
        this._$rtc = value;
        this.updateChildDefinitions();
    }
}
