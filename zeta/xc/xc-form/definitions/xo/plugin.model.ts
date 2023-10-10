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
import { XoStorable } from '../../../../api/xo/xo-storable.model';

import { XoArray, XoArrayClass, XoObjectClass, XoProperty, XoUnique, XoXPRCRuntimeContext } from '../../../../api';


@XoObjectClass(XoStorable, 'xmcp.forms.plugin', 'Plugin')
export class XoPlugin extends XoStorable {

    @XoProperty()
    navigationEntryLabel: string;


    @XoProperty()
    navigationEntryName: string;


    @XoProperty()
    navigationIconName: string;


    @XoProperty()
    definitionWorkflowFQN: string;


    @XoProperty(XoXPRCRuntimeContext)
    pluginRTC: XoXPRCRuntimeContext = new XoXPRCRuntimeContext();


    @XoProperty()
    @XoUnique()
    uniqueIdentifier: number;
}

@XoArrayClass(XoPlugin)
export class XoPluginArray extends XoArray<XoPlugin> {
}
