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
import { XoArrayClass, XoEnumerated, XoObjectClass, XoProperty, XoUnique } from './xo-decorators';
import { RuntimeContext } from './xo-describer';
import { XoArray, XoObject } from './xo-object';


export enum RuntimeContextType {
    Workspace = 'Workspace',
    Application = 'Application'
}


/**
 * @deprecated The corresponding Xyna data type is part of the GuiHttp application,
 * which is not necessarily part of a Zeta-workspace.
 * Use zeta/api/xo/runtime-context.model.ts instead (Xyna data type is part of the Processing application)
 */
@XoObjectClass(null, 'xmcp', 'RuntimeContext')
export class XoRuntimeContext extends XoObject {

    @XoProperty()
    @XoUnique()
    @XoEnumerated([RuntimeContextType.Workspace, RuntimeContextType.Application])
    type: string;

    @XoProperty()
    @XoUnique()
    name: string;

    @XoProperty()
    revision: number;


    get isApplication(): boolean {
        return this.type === RuntimeContextType.Application;
    }


    get isWorkspace(): boolean {
        return this.type === RuntimeContextType.Workspace;
    }


    static fromType(type: string, name?: string, revision?: number): XoRuntimeContext {
        const rtc = new XoRuntimeContext('');
        rtc.type = type;
        rtc.name = name;
        rtc.revision = revision;
        return rtc;
    }


    toString(): string {
        return this.name;
    }


    toRuntimeContext(): RuntimeContext {
        // implemented in inherited classes
        return null;
    }
}


/**
 * @deprecated The corresponding Xyna data type is part of the GuiHttp application,
 * which is not necessarily part of a Zeta-workspace.
 * Use zeta/api/xo/runtime-context.model.ts instead (Xyna data type is part of the Processing application)
 */
@XoArrayClass(XoRuntimeContext)
export class XoRuntimeContextArray extends XoArray<XoRuntimeContext> {
}


/**
 * @deprecated The corresponding Xyna data type is part of the GuiHttp application,
 * which is not necessarily part of a Zeta-workspace.
 * Use zeta/api/xo/runtime-context.model.ts instead (Xyna data type is part of the Processing application)
 */
@XoObjectClass(XoRuntimeContext, 'xmcp', 'Workspace')
export class XoWorkspace extends XoRuntimeContext {

    static fromName(name: string, revision?: number): XoWorkspace {
        const rtc = new XoWorkspace();
        rtc.type = RuntimeContextType.Workspace;
        rtc.name = name;
        rtc.revision = revision;
        return rtc;
    }


    toRuntimeContext(): RuntimeContext {
        return RuntimeContext.fromWorkspace(this.name);
    }
}


/**
 * @deprecated The corresponding Xyna data type is part of the GuiHttp application,
 * which is not necessarily part of a Zeta-workspace.
 * Use zeta/api/xo/runtime-context.model.ts instead (Xyna data type is part of the Processing application)
 */
@XoArrayClass(XoWorkspace)
export class XoWorkspaceArray extends XoArray<XoWorkspace> {
}



/**
 * @deprecated The corresponding Xyna data type is part of the GuiHttp application,
 * which is not necessarily part of a Zeta-workspace.
 * Use zeta/api/xo/runtime-context.model.ts instead (Xyna data type is part of the Processing application)
 */
@XoObjectClass(XoRuntimeContext, 'xmcp', 'Application')
export class XoApplication extends XoRuntimeContext {

    @XoProperty()
    @XoUnique()
    versionName: string;


    static fromName(name: string, version: string, revision?: number): XoApplication {
        const rtc = new XoApplication();
        rtc.type = RuntimeContextType.Application;
        rtc.name = name;
        rtc.versionName = version;
        rtc.revision = revision;
        return rtc;
    }


    toString(): string {
        return this.name + ' ' + this.versionName;
    }


    toRuntimeContext(): RuntimeContext {
        return RuntimeContext.fromApplicationVersion(this.name, this.versionName);
    }
}


/**
 * @deprecated The corresponding Xyna data type is part of the GuiHttp application,
 * which is not necessarily part of a Zeta-workspace.
 * Use zeta/api/xo/runtime-context.model.ts instead (Xyna data type is part of the Processing application)
 */
@XoArrayClass(XoApplication)
export class XoApplicationArray extends XoArray<XoApplication> {
}
