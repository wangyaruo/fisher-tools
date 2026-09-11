<script setup lang="ts">
import { NEUTRAL_SCORE } from '@fisher-tools/shared/scoring/guides'
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard title="分数是怎么算出来的" subtitle="一条加权平均，外加两条可自行验算的自洽规则">
    <div class="ft-prose">
      <p>
        模型把每个因子先各自打成 <strong>0–100 的原始分</strong>，
        <span class="ft-mono">{{ NEUTRAL_SCORE }}</span> 视为中性、不加不减。
        然后用权重把它们合成总分：
      </p>

      <p class="ft-formula ft-mono">
        总分 = 50 + Σ( 有效权重<sub>i</sub> × ( 因子原始分<sub>i</sub> − 50 ) )
      </p>

      <p>
        界面上每一项显示的「+1.24」「−0.86」，就是公式里的
        <span class="ft-mono">有效权重 × (原始分 − 50)</span>，称为该因子的
        <strong>贡献值</strong>。由此得到两条可以直接验算的规则：
      </p>

      <ul class="ft-rules">
        <li>
          <strong>所有贡献值相加，必定等于总分减 50。</strong>
          如果页面上加减分加起来与总分对不上，那就是模型出了问题，而不是显示四舍五入的误差。
        </li>
        <li>
          <strong>贡献值为正即加分项，为负即扣分项，绝对值越大影响越大。</strong>
          排序由此而来，与权重无关——权重只决定「同样的偏差能撬动多少分」。
        </li>
      </ul>

      <p>
        当某个因子所需的数据缺失时，它会被<strong>标记为降级并退出计算</strong>，
        而不是按 50 分或 0 分计入。剩余因子的权重按比例放大，使有效权重之和仍为 1。
        这样做的代价是分数由更少的因子决定，但避免把「没有数据」误报成「条件很差」。
      </p>

      <p class="ft-note">
        需要明确的是：权重是人为设定的先验，不是从渔获数据里拟合出来的。
        它反映的是「作者认为哪些条件更重要」，因此只适合作相对提示，
        不同水域按本地经验校正比照搬更合理。
      </p>
    </div>
  </PanelCard>
</template>

<style scoped>
.ft-prose p {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.85;
}

.ft-prose p:last-child {
  margin-bottom: 0;
}

.ft-prose strong {
  color: var(--ft-accent-strong);
  font-weight: 500;
}

.ft-formula {
  padding: 12px 14px;
  background: var(--ft-surface-alt);
  border: 1px solid var(--ft-border);
  border-radius: var(--ft-radius);
  font-size: 13px;
  text-align: center;
}

.ft-rules {
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.85;
}

.ft-rules li {
  margin-bottom: 6px;
}
</style>
