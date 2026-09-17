import { DEFAULT_LOOK, LOOK_SLOTS, type AvatarLook, type Pin } from '@shared/types'
import { ART, ART_H, ART_W, type HairArt, type Sprite } from './avatarArt'
import { ownedKey } from './wallet'

/**
 * 캐릭터 — 기록을 쌓으면 자라고, 꾸밀 수 있는 것이 늘어난다.
 *
 * 설계에서 가장 중요한 결정 하나:
 *   **레벨과 경험치는 저장하지 않는다. 기록(pins)에서 매번 계산한다.**
 *
 *   저장하면 두 개의 진실이 생긴다 — 기록을 지웠는데 레벨은 그대로인 상태가
 *   가능해지고, 어느 쪽이 맞는지 아무도 모르게 된다. 저장 파일을 고쳐서 레벨을
 *   올리는 것도 가능해진다. 여기서는 기록이 유일한 진실이고, 레벨은 그것을
 *   바라보는 방법일 뿐이다.
 *
 *   저장하는 것은 "무엇을 입고 있는가"(AvatarLook)뿐이다.
 */

/* ─────────────────────────────────────────────────────────────
 * 경험치와 레벨
 * ──────────────────────────────────────────────────────────── */

/**
 * 기록 하나가 주는 경험치.
 *
 * 보너스를 붙인 이유는 '많이'뿐 아니라 '잘' 기록하는 쪽에도 보상을 주기 위해서다.
 * 집중 기록과 상세 메모는 둘 다 손이 더 가는 행동이다.
 */
export const XP = { base: 10, focus: 5, detail: 3 } as const

export function pinXp(pin: Pin): number {
  return (
    XP.base + (pin.isFocusMode ? XP.focus : 0) + (pin.detail?.trim() ? XP.detail : 0)
  )
}

export const MAX_LEVEL = 17

/**
 * 레벨 L → L+1 에 필요한 경험치.
 *
 * 선형으로 늘린다(100, 160, 220 …). 지수형은 초반이 너무 빠르고 후반이 절벽이라,
 * 하루 몇 건 쓰는 앱에는 맞지 않는다. 이 곡선이면 하루 6건 정도 쓰는 사람이
 * 이틀에 한 레벨씩 오르다가 점점 느려진다.
 */
export const levelCost = (level: number): number => 100 + (level - 1) * 60

export interface Progress {
  level: number
  /** 지금까지 모은 총 경험치 */
  totalXp: number
  /** 현재 레벨에서 모은 양 */
  intoLevel: number
  /** 다음 레벨까지 필요한 양 (만렙이면 0) */
  need: number
  /** 0~1, 진행 바용 */
  ratio: number
  /** 오늘(또는 어제)까지 이어진 연속 기록 일수 */
  streak: number
  /** 만렙 도달 여부 */
  maxed: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (ts: number): number => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * 연속 기록 일수.
 *
 * 오늘 아직 안 썼다고 해서 연속이 끊긴 것으로 보지 않는다 — 하루가 다 지나야
 * 끊긴다. 아침에 앱을 열었을 때 "연속 0일"이 떠 있으면 그날 쓸 마음이 사라진다.
 */
export function streakDays(pins: Pin[]): number {
  if (pins.length === 0) return 0
  const days = new Set(pins.map((p) => startOfDay(p.timestamp)))
  const today = startOfDay(Date.now())

  // 오늘 기록이 있으면 오늘부터, 없으면 어제부터 거슬러 센다
  let cursor = days.has(today) ? today : today - DAY_MS
  if (!days.has(cursor)) return 0

  let n = 0
  while (days.has(cursor)) {
    n++
    cursor -= DAY_MS
  }
  return n
}

export function progressOf(pins: Pin[]): Progress {
  const totalXp = pins.reduce((sum, p) => sum + pinXp(p), 0)

  let level = 1
  let rest = totalXp
  while (level < MAX_LEVEL && rest >= levelCost(level)) {
    rest -= levelCost(level)
    level++
  }

  const maxed = level >= MAX_LEVEL
  const need = maxed ? 0 : levelCost(level)
  return {
    level,
    totalXp,
    intoLevel: maxed ? 0 : rest,
    need,
    ratio: maxed ? 1 : Math.min(1, rest / need),
    streak: streakDays(pins),
    maxed
  }
}

/** 레벨별 칭호 — 숫자만 오르면 무슨 의미인지 와닿지 않는다 */
export function levelTitle(level: number): string {
  if (level >= 14) return '핀 마스터'
  if (level >= 11) return '기록 장인'
  if (level >= 8) return '시간 조련사'
  if (level >= 5) return '습관 수집가'
  if (level >= 3) return '성실 기록가'
  return '새싹 기록가'
}

/* ─────────────────────────────────────────────────────────────
 * 픽셀 스프라이트
 * ──────────────────────────────────────────────────────────── */

/*
 * 그림 자체는 lib/avatarArt.ts 에 있다 (scripts/avatar-art/ 에서 생성, 직접 고치지 않는다).
 * 여기서는 '어떤 아이템이 어떤 그림을 쓰는가'와 '색'만 정한다.
 *
 * 컨셉 01(PinLog PIXEL AVATAR) 기준 32×40 격자. 예전 16×18 은 작은 크기에서는
 * 또렷했지만 머리결·옷감·표정을 담을 칸이 없었다. 대신 이 해상도는 40칸의
 * 정수배(80·120·160px)로 그려야 픽셀이 고르게 떨어진다.
 */
export type { Sprite }

export const PX_W = ART_W
export const PX_H = ART_H

/**
 * 글자 → 색 (고정색).
 *
 * `O`(외곽선)와 `G`(바닥 그림자)만 CSS 변수다 — 테마에 따라 바뀌어야 하는 둘.
 * 짙은 갈색 외곽선을 어두운 카드 위에 그대로 두면 실루엣 가장자리가 배경에 먹힌다.
 *
 * 고른 항목이 채우는 글자 (여기 없고 SLOTS 의 colors 에 있다):
 *   S s B M  피부 · 그늘 · 볼 · 입       ← 피부
 *   H h d    머리 · 빛 · 그늘             ← 머리색
 *   C c K k i 옷 · 빛 · 그늘 · 여밈 · 시보리 ← 상의
 */
const INK: Record<string, string> = {
  O: 'var(--px-outline)',
  G: 'var(--px-shadow)',
  E: '#2b2326', // 눈
  I: '#ffffff', // 선글라스 반사
  U: '#fbf5ea', // 셔츠 깃
  T: '#fbf3e6', // 셔츠 · 머그 · 방울
  t: '#e9ded0',
  Y: '#f6d67a', // 책갈피 핀 · 머리끈 · 연필
  P: '#3b4566', // 바지
  p: '#2c3452',
  W: '#f4ead8', // 신발
  w: '#d8c9b1',
  g: '#d4a445', // 동그란 금테
  x: '#3b2f2c', // 뿔테
  z: '#141416', // 선글라스 렌즈
  A: '#6d97d8', // 캡 · 책갈피 끈 · 머그 로고
  a: '#4f76bd',
  Q: '#f4a58c', // 리본 · 지우개
  q: '#d9836b',
  N: '#9cc3a6', // 털모자 · 잎
  n: '#7aa88a',
  V: '#f2c65a', // 왕관 · 별 · 해
  v: '#c99a2e',
  X: '#e06a6a', // 왕관 보석
  R: '#8b6446', // 나무(책상·노트·화분)
  r: '#6b4a33',
  L: '#aab3c3', // 노트북 · 구름
  l: '#cbd3df',
  J: '#3f4a66', // 정장
  j: '#323b53'
}

export type SlotId = (typeof LOOK_SLOTS)[number]

export interface AvatarItem {
  id: string
  label: string
  /** 해금에 필요한 레벨. 1 이면 처음부터 가지고 있다. (상점 아이템은 1 — 레벨과 무관하다) */
  level: number
  /**
   * 있으면 **상점 아이템**이다 — 레벨로 열리지 않고 광고 리워드로 산다.
   * 광고가 없는 곳(데스크탑·웹)에서는 목록에서 빠진다.
   */
  price?: number
  /** 캐릭터: 머리통·꼬리 그림 (사람은 없음) */
  animal?: { head: Sprite; tail: Sprite }
  /** 상의: 서 있는 자세의 몸 그림을 통째로 바꾸는 옷 */
  outfit?: Sprite
  /** 안경·모자·소품·배경 그림 */
  sprite?: Sprite
  /** 머리 모양 — 앞(얼굴 위)과 뒤(몸 뒤)로 나뉜다 */
  hair?: HairArt
  /** 색만 바꾸는 칸(피부·머리색·상의)이 채우는 글자 */
  colors?: Record<string, string>
  /** 상의: 같은 색이라도 옷 모양이 다르다 */
  style?: 'cardigan' | 'sweater'
}

export interface Slot {
  id: SlotId
  label: string
  items: AvatarItem[]
}

/**
 * 해금 표.
 *
 * 레벨 2부터 17까지 레벨마다 무언가 하나는 열리도록 섞어 놓았다.
 * 한 슬롯이 연달아 열리면 "또 모자야?" 가 되고, 텀이 길면 올라갈 이유가 사라진다.
 * 그림을 새로 그렸어도 레벨은 그대로다 — 이미 연 사람의 진행을 바꾸지 않는다.
 */
export const SLOTS: Slot[] = [
  {
    /*
     * 캐릭터 — 사람 말고는 전부 상점에서 산다.
     * 동물은 털색이 정해져 있어 피부·머리·머리색 칸을 쓰지 않는다.
     * 대신 S s(손·목)를 털색으로, W w(신발)를 발바닥색으로 덮어써서
     * 사람 몸 그림·옷을 그대로 입는다. F f 털·줄무늬, Z 크림 주둥이.
     */
    id: 'species',
    label: '캐릭터',
    items: [
      { id: 'human', label: '사람', level: 1 },
      {
        id: 'cat', label: '고양이', level: 1, price: 60, animal: ART.species.cat,
        colors: { S: '#eca65a', s: '#d0853f', F: '#eca65a', f: '#c7773a', Z: '#fdf3e2', B: '#f5a3a0', M: '#8a5140', W: '#fdf3e2', w: '#e8d6bd' }
      },
      {
        id: 'puppy', label: '강아지', level: 1, price: 60, animal: ART.species.puppy,
        colors: { S: '#cf975d', s: '#b17c48', F: '#cf975d', f: '#94603a', Z: '#fcf2e3', B: '#f0a594', M: '#8a5140', W: '#fcf2e3', w: '#e6d3ba' }
      }
    ]
  },
  {
    /*
     * 피부색은 전부 레벨 1 이다. 보상이 아니라 '나'이기 때문이다.
     * 자기 모습을 고르는 데 레벨을 요구하면 "너로 보이려면 자격을 갖춰라"가 된다.
     *
     * B(볼)는 피부를 '어둡게'가 아니라 '붉게' 한 값이다. 어둡게만 잡으면
     * 진한 피부에서 볼이 수염 자국처럼 보인다.
     */
    id: 'skin',
    label: '피부',
    items: [
      { id: 'light', label: '밝은', level: 1, colors: { S: '#fde9da', s: '#f1cdb6', B: '#f6b5a6', M: '#e08f7e' } },
      { id: 'apricot', label: '살구', level: 1, colors: { S: '#f8dcc4', s: '#ebbf9f', B: '#f2a896', M: '#d9866f' } },
      { id: 'tan', label: '갈색', level: 1, colors: { S: '#d9a47a', s: '#c08860', B: '#d98a6e', M: '#a8634b' } },
      { id: 'deep', label: '진한', level: 1, colors: { S: '#8a5a3c', s: '#70472f', B: '#a8604a', M: '#5a3222' } }
    ]
  },
  {
    id: 'hair',
    label: '머리',
    items: [
      { id: 'none', label: '없음', level: 1 },
      { id: 'short', label: '짧은머리', level: 1, hair: ART.hair.short },
      // 컨셉 01 의 단발 — 기본 헤어라 레벨 1
      { id: 'bob', label: '단발', level: 1, hair: ART.hair.bob },
      { id: 'long', label: '긴머리', level: 3, hair: ART.hair.long },
      { id: 'curly', label: '곱슬', level: 6, hair: ART.hair.curly },
      { id: 'ponytail', label: '포니테일', level: 10, hair: ART.hair.ponytail },
      { id: 'twin', label: '양갈래', level: 14, hair: ART.hair.twin }
    ]
  },
  {
    /*
     * 머리색은 모양과 따로 고른다. 타고나는 색(검정·갈색·금발)은 레벨 1 —
     * 피부색과 같은 이유다. 보상은 염색 쪽이 맡는다.
     */
    id: 'haircolor',
    label: '머리색',
    items: [
      { id: 'black', label: '검정', level: 1, colors: { H: '#2f2a2e', h: '#4b4550', d: '#1d1a1e' } },
      { id: 'brown', label: '갈색', level: 1, colors: { H: '#5b3e33', h: '#7e5747', d: '#41302a' } },
      { id: 'blonde', label: '금발', level: 1, colors: { H: '#d6ad5f', h: '#ebc985', d: '#b58b45' } },
      { id: 'red', label: '빨강', level: 5, colors: { H: '#a9523b', h: '#c56e53', d: '#833e2c' } },
      { id: 'pink', label: '분홍', level: 9, colors: { H: '#e493c2', h: '#f2b4d8', d: '#c273a2' } },
      { id: 'silver', label: '은발', level: 11, colors: { H: '#b8c0cd', h: '#d7dde6', d: '#8e97a7' } },
      { id: 'blue', label: '파랑', level: 13, colors: { H: '#5c8fd6', h: '#84aee6', d: '#4270b5' } }
    ]
  },
  {
    /*
     * 세 안경은 폭이 같다(얼굴보다 한 칸씩 넓게, 옆머리 위로 다리가 지나간다).
     * 선글라스만 알을 까맣게 채우고, 나머지는 알을 비워 눈이 비친다.
     */
    id: 'glasses',
    label: '안경',
    items: [
      { id: 'none', label: '없음', level: 1 },
      { id: 'round', label: '동그란', level: 4, sprite: ART.glasses.round },
      { id: 'square', label: '뿔테', level: 8, sprite: ART.glasses.square },
      { id: 'sun', label: '썬글라스', level: 12, sprite: ART.glasses.sun }
    ]
  },
  {
    /*
     * 상의 색. 민트만 스웨터고 나머지는 가디건이다 — 컨셉 01 의 변형들을 따랐다.
     * k(여밈)·i(시보리)는 옷색보다 한 단계 어둡게.
     */
    id: 'clothes',
    label: '상의',
    items: [
      { id: 'blue', label: '기본', level: 1, style: 'cardigan', colors: { C: '#6d97d8', c: '#91b3e7', K: '#5379c1', k: '#4466ab', i: '#4f73ba' } },
      { id: 'mint', label: '민트', level: 4, style: 'sweater', colors: { C: '#9cc3a6', c: '#b9d8c1', K: '#7fab8b', k: '#6a9877', i: '#76a283' } },
      { id: 'peach', label: '피치', level: 8, style: 'cardigan', colors: { C: '#f2ab8d', c: '#f7c5ad', K: '#dc8f70', k: '#c7775a', i: '#d68668' } },
      { id: 'grape', label: '포도', level: 12, style: 'cardigan', colors: { C: '#a88fd6', c: '#c3acea', K: '#8b70bd', k: '#735aa3', i: '#8067b3' } },
      // 상점 — 컨셉 05·06. 책상 앞에 앉으면 같은 색 가디건으로 보인다(k 가 금색 여밈이 된다)
      { id: 'star', label: '별빛 망토', level: 1, price: 50, style: 'cardigan', outfit: ART.body.outfit.star, colors: { C: '#343f6b', c: '#4a5790', K: '#262f55', k: '#e0b64c', i: '#b9a7dc' } },
      { id: 'garden', label: '정원 원피스', level: 1, price: 50, style: 'cardigan', outfit: ART.body.outfit.garden, colors: { C: '#617f50', c: '#7d9c69', K: '#4c6a3f', k: '#d9ad45', i: '#f3ead6' } }
    ]
  },
  {
    /*
     * 컨셉 = 자세. 몸 그림을 통째로 갈아끼운다. 머리 위치는 모든 자세에서 같아서
     * 머리카락·안경·모자는 그대로 얹힌다.
     *   기본  — 서 있는 모습 (DAILY)
     *   직장인 — 정장. 넥타이가 고른 상의 색이다
     *   책상 앞 — 노트북 앞에 앉은 모습 (FOCUS)
     */
    id: 'concept',
    label: '컨셉',
    items: [
      { id: 'none', label: '기본', level: 1 },
      { id: 'office', label: '직장인', level: 15 },
      { id: 'desk', label: '책상 앞', level: 17 }
    ]
  },
  {
    // 모자는 머리카락을 '덮는다'. 위에 얹으면 붕 뜨고 아래로 머리가 삐져나온다.
    id: 'hat',
    label: '모자',
    items: [
      { id: 'none', label: '없음', level: 1 },
      { id: 'cap', label: '캡모자', level: 2, sprite: ART.hat.cap },
      { id: 'ribbon', label: '리본', level: 5, sprite: ART.hat.ribbon },
      { id: 'beanie', label: '털모자', level: 9, sprite: ART.hat.beanie },
      { id: 'crown', label: '왕관', level: 13, sprite: ART.hat.crown },
      { id: 'star', label: '별빛 모자', level: 1, price: 30, sprite: ART.hat.star },
      { id: 'bonnet', label: '꽃 보닛', level: 1, price: 30, sprite: ART.hat.bonnet }
    ]
  },
  {
    // 손에 드는 물건. 연필+노트는 DAILY, 머그는 BREAK 장면이다.
    id: 'prop',
    label: '소품',
    items: [
      { id: 'none', label: '없음', level: 1 },
      { id: 'pen', label: '연필', level: 3, sprite: ART.prop.pen },
      { id: 'mug', label: '머그컵', level: 7, sprite: ART.prop.mug },
      { id: 'plant', label: '화분', level: 11, sprite: ART.prop.plant },
      { id: 'moonbook', label: '달 일기장', level: 1, price: 20, sprite: ART.prop.moonbook },
      { id: 'quill', label: '깃펜', level: 1, price: 20, sprite: ART.prop.quill },
      { id: 'can', label: '물뿌리개', level: 1, price: 20, sprite: ART.prop.can }
    ]
  },
  {
    id: 'scene',
    label: '배경',
    items: [
      { id: 'none', label: '없음', level: 1 },
      { id: 'stars', label: '별밤', level: 6, sprite: ART.scene.stars },
      { id: 'sunrise', label: '아침해', level: 10, sprite: ART.scene.sunrise },
      { id: 'party', label: '색종이', level: 16, sprite: ART.scene.party }
    ]
  }
]

const slotById = (id: SlotId): Slot => SLOTS.find((s) => s.id === id) as Slot

export function itemOf(slot: SlotId, id: string): AvatarItem | undefined {
  return slotById(slot).items.find((i) => i.id === id)
}

/**
 * 이미 가지고 있는가.
 *
 * 레벨이 충분하거나, **이미 입고 있으면** 가진 것으로 본다.
 * 두 번째 조건이 중요하다 — 기록을 지우면 레벨이 내려갈 수 있는데, 그때
 * 쓰고 있던 왕관을 빼앗으면 "기록을 지웠더니 내 물건이 사라졌다"가 된다.
 * 한 번 연 것은 도로 잠그지 않는다.
 */
export function isUnlocked(
  slot: SlotId,
  item: AvatarItem,
  level: number,
  equippedId: string,
  owned: readonly string[] = []
): boolean {
  if (item.id === equippedId) return true
  // 상점 아이템은 레벨로 열리지 않는다 — 샀는지만 본다
  if (item.price !== undefined) return owned.includes(ownedKey(slot, item.id))
  return level >= item.level
}

/** 상점 아이템인가 */
export const isShopItem = (item: AvatarItem): boolean => item.price !== undefined

/** 화면에 보일 아이템 — 상점이 없는 곳에서는 상점 아이템을 뺀다 */
export const visibleItems = (slot: Slot, shop: boolean): AvatarItem[] =>
  shop ? slot.items : slot.items.filter((i) => !isShopItem(i))

/** 동물 캐릭터는 이 칸들을 쓰지 않는다 (털색이 정해져 있다) */
export const HUMAN_ONLY_SLOTS: readonly SlotId[] = ['skin', 'hair', 'haircolor']

/** 저장된 값에 없는 id 가 들어 있으면 기본값으로 되돌린다 */
export function sanitizeLook(look: AvatarLook): AvatarLook {
  const out = { ...DEFAULT_LOOK }
  for (const slot of LOOK_SLOTS) {
    const id = look[slot]
    if (itemOf(slot, id)) out[slot] = id
  }
  return out
}

/** old → next 로 오르면서 새로 열린 아이템들 (레벨업 알림용) */
export function unlockedBetween(oldLevel: number, newLevel: number): AvatarItem[] {
  if (newLevel <= oldLevel) return []
  return SLOTS.flatMap((s) =>
    s.items.filter((i) => i.level > oldLevel && i.level <= newLevel)
  )
}

/** 다음에 열릴 아이템 하나 (없으면 null) — "조금만 더" 를 보여주기 위한 것 */
export function nextUnlock(level: number): AvatarItem | null {
  const upcoming = SLOTS.flatMap((s) => s.items).filter((i) => i.level > level)
  if (upcoming.length === 0) return null
  return upcoming.reduce((a, b) => (b.level < a.level ? b : a))
}

/* ─────────────────────────────────────────────────────────────
 * 그리기
 * ──────────────────────────────────────────────────────────── */

export interface Run {
  x: number
  y: number
  w: number
  fill: string
}

/**
 * 스프라이트를 가로로 이어진 칸끼리 묶어 사각형 목록으로 바꾼다.
 *
 * 칸마다 <rect> 를 하나씩 찍으면 16x18 한 장에 최대 288 개가 나오고,
 * 레이어가 넷이니 천 개를 넘는다. 같은 색이 가로로 이어진 구간을 하나로 묶으면
 * 대개 1/4 이하로 줄어든다. 픽셀 아트는 가로로 같은 색이 이어지는 그림이라
 * 이 단순한 묶음만으로 충분하다.
 */
export function toRuns(sprite: Sprite, colors: Record<string, string>): Run[] {
  const runs: Run[] = []
  sprite.rows.forEach((row, r) => {
    const y = sprite.top + r
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.') {
        x++
        continue
      }
      let w = 1
      while (x + w < row.length && row[x + w] === ch) w++
      const fill = colors[ch]
      if (fill) runs.push({ x, y, w, fill })
      x += w
    }
  })
  return runs
}

/**
 * 한 벌 차림을 그릴 레이어 목록으로. 뒤에서 앞 순서:
 *
 *   배경 → 뒷머리 → 몸(자세·옷 모양) → 머리통 → 앞머리 → 안경 → 모자 → 소품
 *
 * 뒷머리가 몸보다 뒤에 와야 긴 머리가 어깨 '뒤로' 넘어간다.
 * 책상 앞 자세에서는 소품을 그리지 않는다 — 손이 노트북 위에 있어 들 수가 없고,
 * 그리면 연필·머그가 허공에 뜬다.
 */
export function layersOf(look: AvatarLook): Run[][] {
  const safe = sanitizeLook(look)
  const skin = itemOf('skin', safe.skin)?.colors ?? itemOf('skin', DEFAULT_LOOK.skin)!.colors!
  const hairColor = itemOf('haircolor', safe.haircolor)?.colors ?? {}
  const clothes = itemOf('clothes', safe.clothes)
  const style = clothes?.style ?? 'cardigan'
  // 동물은 털색이 피부색 위에 덮인다 (손·목·발이 털이 된다)
  const species = itemOf('species', safe.species)
  const animal = species?.animal
  const colors = {
    ...INK, ...skin, ...hairColor, ...(clothes?.colors ?? {}), ...(animal ? species.colors : {})
  }

  const desk = safe.concept === 'desk'
  const body =
    safe.concept === 'office' ? ART.body.office
    : desk ? ART.body.desk[style]
    : (clothes?.outfit ?? ART.body.stand[style])
  const hair = animal ? undefined : itemOf('hair', safe.hair)?.hair
  const sprite = (slot: SlotId): Sprite | undefined => itemOf(slot, safe[slot])?.sprite

  const stack: (Sprite | undefined)[] = [
    sprite('scene'),
    hair?.back,
    // 꼬리는 몸 뒤. 책상 앞에서는 의자에 가려 그리지 않는다
    animal && !desk ? animal.tail : undefined,
    body,
    animal ? animal.head : ART.head,
    hair?.front,
    sprite('glasses'),
    sprite('hat'),
    desk ? undefined : sprite('prop')
  ]
  return stack.filter((x): x is Sprite => !!x).map((sp) => toRuns(sp, colors))
}

/** 미리보기용 — 슬롯 하나만 바꾼 차림 */
export const withPart = (look: AvatarLook, slot: SlotId, id: string): AvatarLook => ({
  ...look,
  [slot]: id
})
