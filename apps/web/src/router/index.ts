import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'overview',
      component: () => import('@/views/overview/OverviewView.vue'),
      meta: { title: '垂钓总览' },
    },
    {
      path: '/weather',
      name: 'weather',
      component: () => import('@/views/weather/WeatherView.vue'),
      meta: { title: '气象曲线' },
    },
    {
      path: '/astronomy',
      name: 'astronomy',
      component: () => import('@/views/astronomy/AstronomyView.vue'),
      meta: { title: '日月与潮汐' },
    },
    {
      // 列表与详情共用同一个视图组件，由路由参数区分展示形态
      path: '/knowledge/:slug?',
      name: 'knowledge',
      component: () => import('@/views/knowledge/KnowledgeView.vue'),
      meta: { title: '知识库' },
    },
    {
      path: '/glossary',
      name: 'glossary',
      component: () => import('@/views/glossary/GlossaryView.vue'),
      meta: { title: '垂钓术语表' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/about/AboutView.vue'),
      meta: { title: '关于本站' },
    },
    {
      path: '/scoring',
      name: 'scoring',
      component: () => import('@/views/scoring/ScoringView.vue'),
      meta: { title: '指数解读' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? '钓鱼助手'
  document.title = `${title} · 钓鱼助手`
})
