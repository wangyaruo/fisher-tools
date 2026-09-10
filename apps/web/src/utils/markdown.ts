import { marked } from 'marked'

/**
 * 把知识库正文的 Markdown 渲染成 HTML。
 *
 * 正文是仓库内置的文件，属可信内容，因此这里直接交给 marked。
 * 若将来支持用户投稿，必须先接入 HTML 清洗 —— marked 不负责剔除
 * <script>、事件属性等可执行标记，而调用方是通过 v-html 注入结果的。
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false, gfm: true })
}
