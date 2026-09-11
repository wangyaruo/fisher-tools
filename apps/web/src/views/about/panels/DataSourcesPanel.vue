<script setup lang="ts">
import { DATA_SOURCES } from '@/data/about'
import PanelCard from '@/components/base/PanelCard.vue'
</script>

<template>
  <PanelCard
    title="数据来源"
    subtitle="全部为公开来源，无需申请密钥；使用须遵守对应授权"
  >
    <el-table :data="DATA_SOURCES" size="small" class="ft-sources">
      <el-table-column prop="item" label="数据" min-width="220" />

      <el-table-column label="来源" min-width="180">
        <template #default="{ row }">
          <span class="ft-mono">{{ row.provider }}</span>
        </template>
      </el-table-column>

      <el-table-column label="授权" width="100">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.license }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="需 Key" width="86" align="center">
        <template #default="{ row }">
          <span :class="row.needKey ? 'ft-sources__yes' : 'ft-muted'">
            {{ row.needKey ? '需要' : '不需要' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="说明" min-width="260">
        <template #default="{ row }">
          <span class="ft-note">{{ row.note ?? '—' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <p class="ft-note ft-sources__foot">
      气象与海洋数据均要求署名，本站已在页脚与各页面的「数据来源」区块原样展示提供方信息。
      上游按日限量，服务端设了 600 秒内存缓存并对同键并发请求做去重；若面向较大流量应改用自建缓存或付费层。
    </p>
  </PanelCard>
</template>

<style scoped>
.ft-sources {
  width: 100%;
}

.ft-sources__yes {
  color: var(--ft-warn);
}

.ft-sources__foot {
  margin: 12px 0 0;
}
</style>
