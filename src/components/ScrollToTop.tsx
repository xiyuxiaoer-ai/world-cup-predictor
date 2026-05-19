'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // 禁用浏览器自动恢复滚动位置
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    // 立即滚动一次
    scrollToTop()

    // 内容渲染后再滚一次（防止数据加载后页面高度变化导致偏移）
    const timer = setTimeout(scrollToTop, 150)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
