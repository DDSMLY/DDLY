import { createApp } from 'vue'
import App from './App.vue'
import BackButton from './components/BackButton.vue'

const app = createApp(App)
app.component('BackButton', BackButton) // 全局注册返回组件
app.mount('#app')