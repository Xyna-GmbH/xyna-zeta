import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';


@XoObjectClass(null, 'xmcp.forms.plugin', 'PluginPath')
export class XoPluginPath extends XoObject {


    @XoProperty()
    path: string;


}

@XoArrayClass(XoPluginPath)
export class XoPluginPathArray extends XoArray<XoPluginPath> {
}
