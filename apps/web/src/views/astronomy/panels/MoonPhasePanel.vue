<script setup lang="ts">
import { computed } from 'vue'
import type { MoonInfo, Solunar } from '@fisher-tools/shared/schemas'
import KeyValueList from '@/components/base/KeyValueList.vue'
import PanelCard from '@/components/base/PanelCard.vue'
import type { KeyValueItem } from '@/components/base/types'
import MoonPhaseGlyph from '@/components/MoonPhaseGlyph.vue'
import { number, percent } from '@/utils/format'

const props = defineProps<{
  moon: MoonInfo | null
  solunar: Solunar | null
}>()

/**
 * 高度角为负说明月亮已在地平线下 —— 这件事直接决定「月亮此刻是否可能影响垂钓」，
 * 只给一个带负号的度数容易读不出来，因此补一句文字说明。
 */
const items = computed<KeyValueItem[]>(() => {
  const moon = props.moon
  if (!moon) return []

  return [
    { label: '月相', value: `${moon.phaseNameZh} · 照度 ${percent(moon.illuminatedFraction)}` },
    { label: '月龄', value: `${number(moon.age, 2)} 天（朔望月 29.53 天）` },
    { label: '相位', value: number(moon.phase, 4) },
    { label: '地心距离', value: `${number(moon.distance, 0)} km` },
    {
      label: '当前高度角',
      value: `${number(moon.altitude, 1)}°`,
      hint: moon.altitude >= 0 ? '（地面以上）' : '（已落至地平线下）',
    },
  ]
})
</script>

<template>
  <!--
    这张卡是「主视觉卡」，三栏横排（月相图形 | 数据 | 强度评级），
    与其余卡片的「标题在上、内容在下」结构不同，因此不传 title / subtitle，
    由 PanelCard 只提供卡片外壳，内部版式自带。
  -->
  <PanelCard class="ft-moonhead">
    <MoonPhaseGlyph v-if="moon" :phase="moon.phase" :size="108" />

    <div class="ft-moonhead__body">
      <h2 class="ft-card__title">月相</h2>
      <p class="ft-card__subtitle">
        相位以 0 为新月、0.5 为满月；数值由 astronomy-engine 实算，非查表近似
      </p>
      <KeyValueList v-if="items.length > 0" :items="items" />
    </div>

    <div v-if="solunar" class="ft-moonhead__rating">
      <span class="ft-moonhead__ratinglabel">当日日月强度</span>
      <span class="ft-moonhead__ratingvalue">{{ solunar.score.toFixed(1) }}</span>
      <span class="ft-moonhead__ratinggrade">{{ solunar.dayRatingZh }}</span>
    </div>
  </PanelCard>
</template>

<style scoped>
.ft-moonhead {
  display: flex;
  gap: 22px;
  align-items: flex-start;
}

.ft-moonhead__body {
  flex: 1;
  min-width: 0;
}

.ft-moonhead__rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 128px;
  padding: 14px;
  border-radius: var(--ft-radius);
  border: 1px solid #9fe1cb;
  background: var(--ft-accent-soft);
  color: var(--ft-accent-strong);
}

.ft-moonhead__ratinglabel {
  font-size: 12px;
}

.ft-moonhead__ratingvalue {
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.ft-moonhead__ratinggrade {
  font-size: 12px;
}

@media (max-width: 760px) {
  .ft-moonhead {
    flex-wrap: wrap;
  }
}
</style>
