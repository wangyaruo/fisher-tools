<script setup lang="ts">
import { VERIFICATIONS } from '@/data/about'
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard
    title="交叉验证记录"
    subtitle="凡涉及方向与数值的结论，用两套独立来源对一遍"
  >
    <ul class="ft-verifies">
      <li v-for="item in VERIFICATIONS" :key="item.item" class="ft-verify">
        <p class="ft-verify__item">{{ item.item }}</p>
        <p class="ft-verify__row"><span class="ft-verify__key">方法</span>{{ item.method }}</p>
        <p class="ft-verify__row"><span class="ft-verify__key">结果</span>{{ item.result }}</p>
      </li>
    </ul>

    <p class="ft-note ft-verifies__foot">
      本地天文计算与上游气象服务商（其数据来自多家国家气象机构）属两套独立实现，
      在日出日落上完全一致，说明该点上不存在系统性偏差。这两项之外的计算尚无第三方可比对，
      不应默认同样可靠。
    </p>
  </PanelCard>
</template>

<style scoped>
.ft-verifies {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ft-verify {
  padding-top: 12px;
  border-top: 1px solid var(--ft-border);
}

.ft-verify:first-child {
  padding-top: 0;
  border-top: none;
}

.ft-verify__item {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
}

.ft-verify__row {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ft-text-muted);
}

.ft-verify__key {
  display: inline-block;
  min-width: 34px;
  color: var(--ft-text);
}

.ft-verifies__foot {
  margin: 12px 0 0;
}
</style>
