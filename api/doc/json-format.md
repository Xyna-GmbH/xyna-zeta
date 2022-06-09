# REST Api

## structure

The call returns a map with the structures of all requested objects. Each requested object is defined by its full qualified name (fqn) and an optional runtime context (rtc). If no runtime context is given, the runtime context of the url is used as a fallback. The optional revision parameter defines a certain repository revision in which all objects should be resolved. Otherwise, the objects get reolved in their current deployment state.

For performance reasons, all requests should be consolidated into as few calls as possible.

<table>
<thead>
<tr>
<th>URL</th>
<th>Request</th>
<th>Response</th>
</tr>
</thead>
<tbody>
<tr>
<td style="vertical-align: top;">

```
/runtimeContext/${rtc}/structure
```
</td>
<td style="vertical-align: top;">

```json
{
    "revision": 34854869,
    "objects": [
        {
            "fqn": "xmcp.TimeSpan",
            "rtc": {
                "workspace": "restspace"
            }
        }
    ]
}
```
</td>
<td style="vertical-align: top;">

```json
{
    "xmcp.TimeSpan": {
        "$object": {
            "fqn": "xmcp.TimeSpan",
            "rtc": {
                "workspace": "restspace"
            },
            "label": "Time Span",
            "docu": "",
            "abstract": true
        },
        "start": {
            "$label": "Start",
            "$docu": "",
            "$primitive": {
                "fqn": "long"
            }
        },
        "stop": {
            "$label": "Stop",
            "$docu": "",
            "$primitive": {
                "fqn": "long"
            }
        }
    }
}
```
</td>
</tbody>
</table>

## subtypes

The call returns a map with the sub types of all requested objects. Each requested object is defined by its full qualified name (fqn) and an optional runtime context (rtc). If no runtime context is given, the runtime context of the url is used as a fallback.

For performance reasons, all requests should be consolidated into as few calls as possible.

<table>
<thead>
<tr>
<th>URL</th>
<th>Request</th>
<th>Response</th>
</tr>
</thead>
<tbody>
<tr>
<td style="vertical-align: top;">

```
/runtimeContext/${rtc}/subtypes
```
</td>
<td style="vertical-align: top;">

```json
{
    "objects": [
        {
            "fqn": "xmcp.TimeSpan",
            "rtc": {
                "workspace": "restspace"
            }
        }
    ]
}
```
</td>
<td style="vertical-align: top;">

```json
{
    "xmcp.TimeSpan": [
        {
            "fqn": "xmcp.TimeSpan",
            "rtc": {
                "workspace": "restspace"
            },
            "label": "Time Span",
            "abstract": true,
            "docu": ""
        },
        {
            "fqn": "xmcp.SimpleTimeSpan",
            "rtc": {
                "workspace": "restspace"
            },
            "label": "Simple Time Span",
            "abstract": false,
            "docu": ""
        },
        {
            "fqn": "xmcp.ComplexTimeSpan",
            "rtc": {
                "workspace": "restspace"
            },
            "label": "Complex Time Span",
            "abstract": false,
            "docu": ""
        }
    ]
}
```
</td>
</tbody>
</table>