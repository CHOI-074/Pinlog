import { useEffect, useState } from 'react'

/** 1초마다 갱신되는 현재 시각. 아날로그/디지털 시계가 공유한다. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** 12시간 다이얼에서의 각도(도). 12시 방향 = 0도, 시계방향. */
export function dialAngle(timestamp: number): number {
  const d = new Date(timestamp)
  const hours = d.getHours() % 12
  const minutes = d.getMinutes()
  return (hours + minutes / 60) * 30
}

/** 각도를 SVG 좌표로. cx/cy 중심, r 반지름. */
export function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export const hhmm = (ts: number): string =>
  new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })

export const dateLabel = (ts: number): string =>
  new Date(ts).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

/** 같은 날인가 (타임라인 날짜 구분선용) */
export const isSameDay = (a: number, b: number): boolean => {
  const x = new Date(a)
  const y = new Date(b)
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  )
}
