import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
// EP 官方暗色变量包：在 html.dark 下生效，必须放在全量样式之后
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
// 全量引入 Element Plus 并固定中文语言包，保证日期与分页等内置文案一致
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
