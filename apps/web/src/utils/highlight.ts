/**
 * 检索片段的关键词高亮。
 *
 * 顺序不能反 —— 必须先转义、再插入 <mark>。
 * 片段来自知识库正文，而调用方是通过 v-html 注入结果的：
 * 一旦先插入 <mark> 再整体转义，标记本身会被转义掉；反过来若跳过转义，
 * 正文里任何尖括号都会变成可执行标记。
 */
export function highlightSnippet(snippet: string, term: string): string {
  const escaped = snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (term.length === 0) return escaped

  // 关键词来自用户输入，其中的正则元字符必须转义，否则 . 或 * 会改变匹配范围
  const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return escaped.replace(pattern, (match) => `<mark>${match}</mark>`)
}
