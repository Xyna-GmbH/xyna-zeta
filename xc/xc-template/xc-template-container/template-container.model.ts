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
import { Observable, of } from 'rxjs/';
import { map } from 'rxjs/operators';

import { ApiService, RuntimeContext, XoArray, XoDescriberCache, XoObjectClass, XoStructureField, XoStructureMethod, XoStructureObject, XoStructurePrimitive } from '../../../api';
import { XcDynamicComponentType, XcTemplate } from '../../../xc';
import { XcTemplateFactory } from '../xc-template-factory';
import { XcContainerBaseTemplate, XoTemplateDefinedBase } from './template-container-base.model';
import { XcTemplateContainerComponent } from './xc-template-container.component';


export class XcContainerTemplate extends XcContainerBaseTemplate<XoTemplateDefinedBase> {
    /**
     * Backed templates, access via getter
     */
    private childTemplates: XcTemplate[];

    /**
     * Backed structure, access via getter
     */
    private templateStructure: XoStructureObject;
    private readonly structureCache = new XoDescriberCache<XoStructureObject>();
    private retrievingStructure: Observable<XoStructureObject> = null;  // is set if request is pending


    constructor(component: XcDynamicComponentType<XoTemplateDefinedBase>, data: XoTemplateDefinedBase, protected apiService: ApiService, protected rtc: RuntimeContext) {
        super(component, data);

        this.getTemplateStructure().subscribe();
    }


    /**
     * Retrieves the structure of this template
     *
     * @returns Structure if it could be retrieved, null otherwise
     */
    private getTemplateStructure(): Observable<XoStructureObject> {
        if (this.templateStructure) {
            return of(this.templateStructure);
        }
        // retrieve new structure
        const structure = this.data.getLocalStructure();
        if (structure) {
            this.templateStructure = structure;
            return of(this.templateStructure);
        }
        if (this.apiService && this.rtc) {
            if (!this.retrievingStructure) {
                // if retrieving is not pending, retrieve structure
                this.retrievingStructure = this.apiService.getStructure(this.rtc, [this.data], this.structureCache).get(this.data).pipe(
                    map(structureObject => {
                        this.templateStructure = structureObject;
                        this.templateStructure.name = '';
                        this.retrievingStructure = null;
                        return this.templateStructure;
                    })
                );
            }
            return this.retrievingStructure;
        }
        console.warn('XoTemplateDefinedObject: No ApiService or Runtime Context defined to retrieve structure of Xo!');
        return of(null);
    }


    /**
     * Returns templates created out of this container's structure
     *
     * @returns Backed templates or new ones if no backed templates are available (e. g. because of invalidation)
     */
    getChildTemplates(): Observable<XcTemplate[]> {
        const createTemplatesFromStructure = (structure: XoStructureObject): XcTemplate[]  => {
            const templates = [];
            if (structure) {
                structure.children
                    .filter(childField => !(childField instanceof XoStructureMethod))
                    .forEach(childField => {
                        const childTemplates = this.createTemplatesForMember(childField);
                        if (childTemplates.length === 0) {
                            console.log(`no rule to build a template for field "${childField.path}"`);
                        }
                        templates.push(...childTemplates);
                    });
            }
            return templates;
        };

        if (!this.childTemplates) {
            return this.getTemplateStructure().pipe(
                map(structure => {
                    this.childTemplates = createTemplatesFromStructure(structure);
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
        this.childTemplates = null;
        this.templateStructure = null;
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
