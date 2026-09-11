<script setup lang="ts">
import FactorGuidePanel from './panels/FactorGuidePanel.vue'
import FormulaPanel from './panels/FormulaPanel.vue'
import GradePanel from './panels/GradePanel.vue'
import ReadingPanel from './panels/ReadingPanel.vue'
import WeightPanel from './panels/WeightPanel.vue'

/**
 * 钓鱼指数解读。
 *
 * 站上每处显示分数的地方都只给了结论与几句 caveats，读者看不到「为什么加分」
 * 与「这个权重凭什么」。
 *
 * 权重、标签与解读全部从 @fisher-tools/shared 的 guides 入口读取，
 * 而不是在页面里抄一份：抄一份就意味着调整打分函数后，
 * 页面说的与代码做的会各自漂移，而这类不一致几乎不会被测试发现。
 * 该入口刻意不含 fishing-index，避免把 astronomy-engine 打进浏览器包。
 */
</script>

<template>
  <div class="ft-page">
    <FormulaPanel />
    <GradePanel />
    <WeightPanel />
    <FactorGuidePanel />
    <ReadingPanel />
  </div>
</template>
