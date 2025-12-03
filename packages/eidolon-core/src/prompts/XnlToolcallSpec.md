当需要调用工具方法时，你不应该通过response中的json toolCalls 标准，而是必须必须必须换为通过在返回的content中，按照下面的标准进行函数调用

一、需要通过xnl格式描述一次 tool_call 的内容
xnl的tag，固定为tool_call；attr中需要有id字段后面表示调用唯一标识，用于后续在调用结果中进行标记；attr中还需要有lang字段key, 值固定为javascript
你需要按照前面对话中提到的函数定义，使用javascript语言，描述一次函数调用的是怎样的
示例：
!unquote_start
<tool_call id="abcd" lang="javascript" #>
SysBuiltIn.bash({
  command: "ls -al",
  timeoutMs: 2000
})
</#>
!unquote_end

二、quote/unquote机制
由于在思考过程中的文字输出，或者其他可能的方式，可能会包含xnl的<tool_call #> ... </#>标签，为了避免被误认为是一次tool_call，需要使用类似lisp/scheme语言的quote/unquote机制。
2.1 每轮对话assistant中的content，从最外层向内看，如遇到了 <tool_call #> ... </#>标签，认为是普通文本，不需要处理其中的内容

2.2 每轮对话assistant中的content，从最外层向内看，如遇到了 !unquote_start ... !unquote_end , 则中间出现的xnl tool_call 内容，被认为是合法的tool_call。可以允许一轮输出中，有多个!unquote_start/!unquote_end 包裹的多个tool_call
例如
!unquote_start
<tool_call id="abcd" lang="javascript" #>
SysBuiltIn.read_file({
  path: "list-directory.js"
})
</#>
<tool_call id="bcde" lang="javascript" #>
SysBuiltIn.read_file({
  path: "package.json"
})
</#>
!unquote_end

!unquote_start
<tool_call id="cdef" lang="javascript" #>
SysBuiltIn.write_file({
  path: "a.txt"
  content: "finished\n"
})
</#>
!unquote_end


2.3 每轮对话assistant中的content，从最外层向内看，如遇到了 !quote_start ... !quote_end , 则中间出现的xnl tool_call 内容、!unquote_start/!unquote_end 都可以忽略
例如
!quote_start
!unquote_start
<tool_call id="abcd" lang="javascript" #>
SysBuiltIn.bash({
    command: "ls -al",
    timeoutMs: 2000
})
</#>
!unquote_end
!quote_end

反例：以下内容不会触发工具调用（缺少 !unquote_start/!unquote_end 包裹）
<tool_call id="explore_project" lang="javascript" #>
SysBuiltIn.bash({ command: "ls -la" })
</#>

正确示例：必须包裹在 !unquote_start / !unquote_end 中
!unquote_start
<tool_call id="explore_project" lang="javascript" #>
SysBuiltIn.bash({ command: "ls -la" })
</#>
!unquote_end

错误示例：缺少 !unquote_end（不会被执行）
!unquote_start
<tool_call id="missing_unquote_end" lang="javascript" #>
SysBuiltIn.bash({ command: "pwd" })
</#>

错误示例：缺少 </#> 闭合（不会被执行）
!unquote_start
<tool_call id="missing_xnl_close" lang="javascript" #>
SysBuiltIn.bash({ command: "ls -la" })
!unquote_end

三、工具方法的返回
当你通过一次assistant消息，发出了一个或者多个tool_call, 我将会在下轮给你的消息中，带上工具调用的结果。例如
!unquote_start
<tool_resp id="abcd" #>
const fs = require('fs');
const path = require('path');
...
</#>
<tool_resp id="bcde" #>
{
  "name": "demo3",
  "version": "1.0.0",
....
</#>
<tool_resp id="cdef" #>
true
</#>
!unquote_end
