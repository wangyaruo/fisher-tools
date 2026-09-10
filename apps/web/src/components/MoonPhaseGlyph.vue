<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 相位 0-1。0 为新月、0.25 上弦、0.5 满月、0.75 下弦 */
    phase: number
    /** 渲染尺寸，单位 px */
    size?: number
  }>(),
  { size: 96 },
)

const VIEW = 100
const R = 44

/**
 * 月相几何。
 *
 * 可见的亮面由「亮侧半圆」与「明暗界线椭圆弧」围成：
 * 明暗界线在视线方向上的投影是一个半短轴为 R·|cos(2πp)| 的椭圆，
 * 相位越接近朔望，椭圆越宽、亮面越趋近整个半圆；
 * 越接近上下弦，椭圆越扁、亮面越趋近半圆的一侧。
 * 弧线的扫掠方向决定椭圆是向左凸还是向右凸，即决定亮面是
 * 「蛾眉」（不足半圆）还是「凸月」（超过半圆）。
 */
const litPath = computed(() => {
  const p = ((props.phase % 1) + 1) % 1
  const rx = R * Math.abs(Math.cos(2 * Math.PI * p))
  const waxing = p < 0.5
  const outerSweep = waxing ? 1 : 0
  const terminatorSweep = waxing ? (p < 0.25 ? 0 : 1) : p < 0.75 ? 0 : 1

  const top = 50 - R
  const bottom = 50 + R
  return [
    `M 50 ${top}`,
    `A ${R} ${R} 0 0 ${outerSweep} 50 ${bottom}`,
    `A ${rx.toFixed(2)} ${R} 0 0 ${terminatorSweep} 50 ${top}`,
    'Z',
  ].join(' ')
})

/** 亮面朝左还是朝右，用于给屏幕阅读器一个可读描述 */
const ariaLabel = computed(() => {
  const p = ((props.phase % 1) + 1) % 1
  if (p < 0.02 || p > 0.98) return '新月，几乎不可见'
  if (Math.abs(p - 0.5) < 0.02) return '满月，整轮可见'
  const side = p < 0.5 ? '右侧' : '左侧'
  const amount = p < 0.25 || p > 0.75 ? '蛾眉状，亮面较小' : '凸月，亮面较大'
  return `亮面位于${side}，${amount}`
})
</script>

<template>
  <svg
    class="ft-moon"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${VIEW} ${VIEW}`"
    role="img"
    :aria-label="ariaLabel"
  >
    <circle cx="50" cy="50" :r="R" class="ft-moon__disc" />
    <path :d="litPath" class="ft-moon__lit" />
    <circle cx="50" cy="50" :r="R" class="ft-moon__rim" />
  </svg>
</template>

<style scoped>
.ft-moon__disc {
  fill: #cfd8dc;
}

.ft-moon__lit {
  fill: #f2f6f7;
  stroke: none;
}

.ft-moon__rim {
  fill: none;
  stroke: var(--ft-border);
  stroke-width: 1;
}
</style>
