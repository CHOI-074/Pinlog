/** 조각을 전부 그려 앱이 쓰는 형태({ top, rows })로 묶는다. */
import * as P from './pieces.mjs'
import { toSprite } from './draw.mjs'

export function buildArt() {
  const head = P.head()
  const hair = (h) => ({ front: toSprite(h.front), ...(h.back ? { back: toSprite(h.back) } : {}) })

  return {
    head: toSprite(head),
    body: {
      stand: { cardigan: toSprite(P.bodyStand()), sweater: toSprite(P.sweater(P.bodyStand())) },
      office: toSprite(P.bodyOffice()),
      desk: { cardigan: toSprite(P.bodyDesk()), sweater: toSprite(P.sweater(P.bodyDesk())) },
      // 상점 옷 — 서 있는 자세 전용 (책상 앞에서는 같은 색 가디건으로 앉는다)
      outfit: { star: toSprite(P.bodyStar()), garden: toSprite(P.bodyGarden()) }
    },
    species: {
      cat: { head: toSprite(P.catHead()), tail: toSprite(P.catTail()) },
      puppy: { head: toSprite(P.puppyHead()), tail: toSprite(P.puppyTail()) }
    },
    hair: {
      short: hair(P.hairShort(head)),
      bob: hair(P.hairBob(head)),
      long: hair(P.hairLong(head)),
      curly: hair(P.hairCurly(head)),
      ponytail: hair(P.hairPonytail(head)),
      twin: hair(P.hairTwin(head))
    },
    glasses: {
      round: toSprite(P.glassesRound()),
      square: toSprite(P.glassesSquare()),
      sun: toSprite(P.glassesSun())
    },
    hat: {
      cap: toSprite(P.hatCap()),
      ribbon: toSprite(P.hatRibbon()),
      beanie: toSprite(P.hatBeanie()),
      crown: toSprite(P.hatCrown()),
      star: toSprite(P.hatStar()),
      bonnet: toSprite(P.hatBonnet())
    },
    prop: {
      pen: toSprite(P.propPen()),
      mug: toSprite(P.propMug()),
      plant: toSprite(P.propPlant()),
      moonbook: toSprite(P.propMoonBook()),
      quill: toSprite(P.propQuill()),
      can: toSprite(P.propCan())
    },
    scene: {
      stars: toSprite(P.sceneStars()),
      sunrise: toSprite(P.sceneSunrise()),
      party: toSprite(P.sceneParty())
    }
  }
}
