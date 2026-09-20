<script setup lang="ts">
import { ref } from 'vue'
import {
  CUSTOM_LOCATION_KEY,
  PRESET_LOCATIONS,
  sanitizeCustomLocation,
} from '@/config/locations'
import { useLocationStore } from '@/stores/location'
import AppNav from './AppNav.vue'

/**
 * 顶部固定区：品牌信息 + 钓点与时刻控件 + 导航。
 *
 * 钓点与时刻是全局查询条件，改一次全站各数据页面同时重取数据，
 * 因此这两组控件必须常驻在页头，而不是下沉到各个页面里。
 * 日期选择器允许留空，留空即「此刻」，这也是最常见的用法。
 */
const store = useLocationStore()

/** 自定义钓点对话框的表单状态。坐标用字符串承接输入，保存时才校验转换 */
const dialogVisible = ref(false)
const formName = ref('')
const formLat = ref('')
const formLng = ref('')
const formWater = ref<'淡水' | '沿海' | '河口'>('淡水')
const formError = ref('')

function openCustomDialog(): void {
  // 已有自定义钓点时回填，便于在原基础上微调
  formName.value = store.custom?.name ?? ''
  formLat.value = store.custom ? String(store.custom.latitude) : ''
  formLng.value = store.custom ? String(store.custom.longitude) : ''
  formWater.value = store.custom?.water ?? '淡水'
  formError.value = ''
  dialogVisible.value = true
}

function saveCustom(): void {
  const candidate = sanitizeCustomLocation({
    name: formName.value,
    latitude: formLat.value,
    longitude: formLng.value,
    // 时刻语义全站统一为东八区墙上时间，时区不开放编辑
    timezone: 'Asia/Shanghai',
    water: formWater.value,
  })
  if (!candidate) {
    formError.value = '请检查输入：名称 1-20 字、纬度 -90 至 90、经度 -180 至 180'
    return
  }
  store.setCustom(candidate)
  dialogVisible.value = false
}
</script>

<template>
  <header class="ft-header">
    <div class="ft-header__inner">
      <div class="ft-brand">
        <img src="/favicon.svg" alt="" class="ft-brand__mark" width="30" height="30" />
        <div>
          <h1 class="ft-brand__title">钓鱼助手</h1>
          <p class="ft-brand__desc">
            逐小时气压趋势、昼夜温差曲线、月相与日月活跃时段、潮汐窗口
          </p>
        </div>
      </div>

      <div class="ft-controls">
        <el-select
          :model-value="store.locationKey"
          class="ft-controls__select"
          placeholder="选择钓点"
          @update:model-value="store.setLocation"
        >
          <el-option
            v-for="item in PRESET_LOCATIONS"
            :key="item.key"
            :label="`${item.name}（${item.water}）`"
            :value="item.key"
          />
          <el-option
            v-if="store.custom"
            :key="CUSTOM_LOCATION_KEY"
            :label="`${store.custom.name}（自定义·${store.custom.water}）`"
            :value="CUSTOM_LOCATION_KEY"
          />
        </el-select>

        <el-button text @click="openCustomDialog">自定义钓点</el-button>

        <el-date-picker
          :model-value="store.at"
          type="datetime"
          placeholder="指定出钓时刻（留空为此刻）"
          value-format="YYYY-MM-DDTHH:mm"
          format="YYYY-MM-DD HH:mm"
          class="ft-controls__picker"
          @update:model-value="(value: string | null) => store.setAt(value ?? '')"
        />

        <el-button v-if="store.at" text @click="store.resetAt()">回到此刻</el-button>
      </div>
    </div>

    <AppNav />

    <el-dialog v-model="dialogVisible" title="自定义钓点" width="380px" append-to-body>
      <div class="ft-custom-form">
        <label>
          名称
          <el-input v-model="formName" placeholder="例如：西丽水库" maxlength="20" />
        </label>
        <label>
          纬度
          <el-input v-model="formLat" placeholder="-90 ~ 90，如 22.58" />
        </label>
        <label>
          经度
          <el-input v-model="formLng" placeholder="-180 ~ 180，如 113.95" />
        </label>
        <label>
          水域
          <el-select v-model="formWater">
            <el-option label="淡水" value="淡水" />
            <el-option label="沿海" value="沿海" />
            <el-option label="河口" value="河口" />
          </el-select>
        </label>
        <p class="ft-custom-form__hint">
          水域类型决定海洋面板是否展示；时刻与日出日落按东八区计算。
        </p>
        <p v-if="formError" class="ft-custom-form__error">{{ formError }}</p>
      </div>
      <template #footer>
        <el-button text @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCustom">保存并使用</el-button>
      </template>
    </el-dialog>
  </header>
</template>

<style scoped>
.ft-header {
  /* 半透明 + 毛玻璃：sticky 页头下滚动的内容柔和透出，不再被白边硬切 */
  background: var(--ft-header-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--ft-border);
  /* 常驻顶部：切换页面时查询条件不应滚出视野 */
  position: sticky;
  top: 0;
  z-index: 10;
}

.ft-header__inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 20px 10px;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.ft-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 品牌标记与站点 favicon 同源，浏览器标签与页头视觉统一 */
.ft-brand__mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
  display: block;
}

.ft-brand__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
}

.ft-brand__desc {
  margin: 0;
  font-size: 12px;
  color: var(--ft-text-muted);
  line-height: 1.4;
}

.ft-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ft-controls__select {
  width: 190px;
}

/* Element Plus 给日期选择器写了内联宽度，必须用 !important 覆盖 */
.ft-controls__picker {
  width: 220px !important;
}

.ft-custom-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ft-custom-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--ft-text-muted);
}

.ft-custom-form__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ft-text-muted);
  line-height: 1.6;
}

.ft-custom-form__error {
  margin: 0;
  font-size: 12px;
  color: var(--ft-danger-text);
}
</style>
