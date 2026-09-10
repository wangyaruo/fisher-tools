import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { router } from './router'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// 全量引入 Element Plus 并固定中文语言包，保证日期与分页等内置文案一致
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
