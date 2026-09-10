<script setup lang="ts">
/**
 * 页脚承担两条固定声明：数据来源与责任边界。
 *
 * 这两句放在全局而非各页面，是因为它们与具体页面无关，
 * 却必须出现在任何一页 —— 用户不该因为切到了别的标签就看不到数据来源。
 */
</script>

<template>
  <footer class="ft-footer">
    <div class="ft-footer__inner">
      <span>
        气象数据 Open-Meteo（CC BY 4.0）· 天文计算 astronomy-engine ·
        潮汐为天文潮近似，不含站点潮高
      </span>
      <span>钓鱼指数为基于公开数据的相对提示，不构成出钓保证</span>
    </div>
  </footer>
</template>

<style scoped>
.ft-footer {
  /* 内容不足一屏时把页脚压到底部 */
  margin-top: auto;
  border-top: 1px solid var(--ft-border);
  background: var(--ft-surface);
}

.ft-footer__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ft-text-muted);
}
</style>
