import { describe, expect, it } from 'vitest'
import { highlightSnippet } from './highlight'

describe('highlightSnippet', () => {
  it('命中的关键词包上 <mark>，大小写不敏感', () => {
    expect(highlightSnippet('鲫鱼钓法详解', '鲫鱼')).toBe('<mark>鲫鱼</mark>钓法详解')
    expect(highlightSnippet('VIB 与 vib 的用法', 'vib')).toBe(
      '<mark>VIB</mark> 与 <mark>vib</mark> 的用法',
    )
  })

  it('先转义再插标记：片段里的尖括号不会变成可执行标记', () => {
    expect(highlightSnippet('a <script> b', 'script')).toBe(
      'a &lt;<mark>script</mark>&gt; b',
    )
    expect(highlightSnippet('1 < 2 且 3 > 2', '且')).toBe('1 &lt; 2 <mark>且</mark> 3 &gt; 2')
  })

  it('检索词里的正则元字符按字面量处理', () => {
    expect(highlightSnippet('a.b 与 axb', '.')).toBe('a<mark>.</mark>b 与 axb')
    expect(highlightSnippet('价格是 10*2', '10*2')).toBe('价格是 <mark>10*2</mark>')
  })

  it('空检索词只转义、不加标记', () => {
    expect(highlightSnippet('a <b> c', '')).toBe('a &lt;b&gt; c')
  })

  it('未命中时返回转义后的原文', () => {
    expect(highlightSnippet('鲤鱼习性', '鲫鱼')).toBe('鲤鱼习性')
  })
})
