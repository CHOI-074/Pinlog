import { DEFAULT_LOOK, isAvatarLook, normalizeLook, type AvatarLook } from '@shared/types'
import { getSetting, setSetting } from './settings'

/**
 * 캐릭터가 입고 있는 것.
 *
 * 레벨·경험치는 여기에 없다 — 기록(pins.json)에서 계산한다.
 * 저장하는 건 "무엇을 골랐는가"뿐이라, 기록을 고쳐도 어긋날 상태가 없다.
 *
 * 메인 프로세스가 들고 있는 이유는 테마와 같다: 창이 여러 개라 렌더러의
 * localStorage 에 두면 창마다 값이 갈라진다.
 */

export function getLook(): AvatarLook {
  const raw = getSetting('avatar')
  // 아이템 id 가 실제로 존재하는지는 렌더러가 본다 (스프라이트 목록이 거기 있다)
  return isAvatarLook(raw) ? normalizeLook(raw) : DEFAULT_LOOK
}

export function setLook(look: AvatarLook): AvatarLook {
  if (!isAvatarLook(look)) return getLook()
  const clean = normalizeLook(look)
  setSetting('avatar', clean)
  return clean
}
