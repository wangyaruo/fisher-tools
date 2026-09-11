<script setup lang="ts">
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard title="怎么用这个分数" subtitle="它能回答什么、不能回答什么">
    <div class="ft-prose">
      <p>
        <strong>它适合回答的问题</strong>：今天相比明天、这个时段相比那个时段，
        哪一段更值得安排；以及当下最拖后腿的条件是什么。
        这两种都是「相对比较」，也正是加权模型最擅长的部分。
      </p>

      <p>
        <strong>它不适合回答的问题</strong>：这里有没有鱼、今天能钓几条。
        模型只输入气象与天文量，对水域本身的鱼群密度、水质、捕捞压力一无所知。
        同一片天气条件下的两个水库，实际表现可能完全不同。
      </p>

      <p>
        <strong>不要跨钓点横向比较分数。</strong>
        沿海点位多一个潮汐因子、内陆点位该因子被降级，
        两边的分数由不同的因子集合算出来，数值不具备可比性。
        跨钓点比较时，看的是各自的加减分构成，不是总分。
      </p>

      <p>
        <strong>分数低不等于不能去，而是「不靠天气，靠钓位」。</strong>
        多数因子不利时，能不能有收获主要取决于是否选到了鱼真正待的那个水层与位置。
        这时打开「气象曲线」页看气压与温差的走向，比继续看总分更有用。
      </p>

      <p>
        <strong>分数高也不等于必出鱼。</strong>
        好窗口只意味着条件对鱼有利，鱼是否在你的钓点、是否愿意吃你挂的饵，
        仍然取决于钓法与饵料的选择。
      </p>

      <p class="ft-note">
        最后一条与模型无关：<strong>任何分数都不构成在恶劣天气与危险水边出钓的理由。</strong>
        雷暴、大风、涨水与夜间独行属于安全的判断范畴，规则见知识库的「安全须知」分类。
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

/* 末段是安全提醒，与前面的模型说明性质不同，用底色区分 */
.ft-prose .ft-note {
  padding: 12px 14px;
  background: var(--ft-warn-soft);
  border-radius: var(--ft-radius);
  color: #6b4a12;
}

.ft-prose .ft-note strong {
  color: #6b4a12;
}
</style>
