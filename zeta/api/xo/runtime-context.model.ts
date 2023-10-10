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
import { XoArrayClass, XoObjectClass, XoProperty } from './xo-decorators';
import { RuntimeContext } from './xo-describer';
import { XoArray, XoObject } from './xo-object';


@XoObjectClass(null, 'xprc.xpce', 'RuntimeContext')
export class XoXPRCRuntimeContext extends XoObject {

    toRuntimeContext(): RuntimeContext {
        return null;
    }
}

@XoArrayClass(XoXPRCRuntimeContext)
export class XoXPRCRuntimeContextArray extends XoArray<XoXPRCRuntimeContext> {}





@XoObjectClass(XoXPRCRuntimeContext, 'xprc.xpce', 'Application')
export class XoXPRCApplication extends XoXPRCRuntimeContext {

    @XoProperty()
    name: string;

    @XoProperty()
    version: string;


    static fromRuntimeContext(rtc: RuntimeContext): XoXPRCApplication {
        if (!rtc.av) {
            return null;
        }

        const app = new XoXPRCApplication();
        app.name = rtc.av.application;
        app.version = rtc.av.version;
        return app;
    }


    toRuntimeContext(): RuntimeContext {
        return RuntimeContext.fromApplicationVersion(this.name, this.version);
    }
}

@XoArrayClass(XoXPRCApplication)
export class XoXPRCApplicationArray extends XoArray<XoXPRCApplication> {}





@XoObjectClass(XoXPRCRuntimeContext, 'xprc.xpce', 'Workspace')
export class XoXPRCWorkspace extends XoXPRCRuntimeContext {

    @XoProperty()
    name: string;


    static fromRuntimeContext(rtc: RuntimeContext): XoXPRCWorkspace {
        if (!rtc.ws) {
            return null;
        }

        const ws = new XoXPRCWorkspace();
        ws.name = rtc.ws.workspace;
        return ws;
    }


    toRuntimeContext(): RuntimeContext {
        return RuntimeContext.fromWorkspace(this.name);
    }
}

@XoArrayClass(XoXPRCWorkspace)
export class XoXPRCWorkspaceArray extends XoArray<XoXPRCWorkspace> {}





export const XoXPRCRuntimeContextFromRuntimeContext = (rtc: RuntimeContext): XoXPRCRuntimeContext => {
    if (rtc.ws) {
        return XoXPRCWorkspace.fromRuntimeContext(rtc);
    }
    if (rtc.av) {
        return XoXPRCApplication.fromRuntimeContext(rtc);
    }
    return null;
};
