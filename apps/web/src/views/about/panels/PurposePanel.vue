<script setup lang="ts">
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard title="这个站做什么" subtitle="一句话：把「今天值不值得去、几点去、为什么」讲清楚">
    <div class="ft-prose">
      <p>
        出钓决策真正需要的不是一堆气象数字，而是三件事：
        <strong>条件够不够好</strong>、<strong>好在哪个时段</strong>、
        <strong>这个判断的依据是什么</strong>。本站围绕这三件事组织信息。
      </p>

      <p>
        与常见的天气应用相比，这里做了两处不同的取舍。一是引入
        <strong>气压变化与日月节律</strong> —— 对鱼口而言，气压的方向比气压的绝对值更有意义，
        而日月时段决定了鱼口在一天里什么时候集中。二是把
        <strong>影响权重摆在明面上</strong>：每一项加减分都可以展开看它对总分贡献了多少，
        结论可以从头推一遍，而不是给一个说不清来历的分数。
      </p>

      <p>
        站内不做的三件事同样明确：<strong>不给买装备的建议</strong>（装备与水域、目标鱼强相关，
        脱离场景的建议没有意义）；<strong>不给法规条文</strong>（各地规定差异大且逐年调整，
        写死就会过时，只提供核查路径）；<strong>不承诺渔获</strong>（这是野外作业，
        任何模型都无法覆盖当天的真实水情）。
      </p>

      <p class="ft-note">
        本站是个人向的工具站，非商业产品。数据全部来自公开来源，授权与限制见下方「数据来源」。
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
</style>
