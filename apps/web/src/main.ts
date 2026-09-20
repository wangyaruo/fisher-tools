import { createPinia } from 'pinia'
import { createApp } from 'vue'
import {
  ElAlert,
  ElButton,
  ElConfigProvider,
  ElDatePicker,
  ElDialog,
  ElEmpty,
  ElInput,
  ElOption,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus'
// 按组件引入样式：每个入口自带依赖链（如 date-picker 会拉入 popper 与面板样式），
// 不再整包引入 dist/index.css。新增组件时注册与样式要同步加。
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/date-picker/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/skeleton/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/tag/style/css'
// EP 官方暗色变量包：在 html.dark 下生效，必须放在组件样式之后
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import { router } from './router'
import './styles/main.css'

// 跟随系统的暗色模式：只切换根元素的 dark 类，
// EP 组件与全站 token 的暗色值都挂在 html.dark 选择器下，随类名即时生效
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
const syncDarkClass = (): void => {
  document.documentElement.classList.toggle('dark', darkQuery.matches)
}
syncDarkClass()
darkQuery.addEventListener('change', syncDarkClass)

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 按需注册 EP 组件（全站仅用这 13 个，见组件用量盘点）。
// 中文语言包经 App.vue 根部的 <el-config-provider> 下发。
for (const component of [
  ElAlert,
  ElButton,
  ElConfigProvider,
  ElDatePicker,
  ElDialog,
  ElEmpty,
  ElInput,
  ElOption,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
]) {
  app.use(component)
}

app.mount('#app')
