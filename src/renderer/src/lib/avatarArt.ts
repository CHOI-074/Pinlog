/**
 * 캐릭터 그림 데이터 — 자동 생성 파일. 직접 고치지 마세요.
 *
 * 원본: scripts/avatar-art/pieces.mjs
 * 생성: npm run art
 *
 * 32×40 격자, 한 글자 = 한 픽셀. 글자의 뜻과 색은 lib/avatar.ts 의 팔레트가 정한다.
 */

export interface Sprite {
  /** 첫 줄이 놓일 y (칸) */
  top: number
  rows: string[]
}

export interface HairArt {
  /** 얼굴 앞에 오는 부분 (앞머리·옆머리) */
  front: Sprite
  /** 몸 뒤에 깔리는 부분 (긴 머리·꽁지). 없으면 앞만 있다 */
  back?: Sprite
}

export const ART_W = 32
export const ART_H = 40

export const ART = {
  "head": {
    "top": 4,
    "rows": [
      "..............OOOO..............",
      "...........OOOSSSSOOO...........",
      "..........OSSSSSSSSSSO..........",
      ".........OSSSSSSSSSSSSO.........",
      "........OSSSSSSSSSSSSSSO........",
      ".......OSSSSSSSSSSSSSSSSO.......",
      ".......OSSSSSSSSSSSSSSSSO.......",
      "......OSSSSSSSSSSSSSSSSSSO......",
      ".....OSSSSSEESSSSSSEESSSSSO.....",
      ".....OsSSSSEESSSSSSEESSSSsO.....",
      ".....OSSSSSEESSSSSSEESSSSSO.....",
      "......OOSBBSSSSSSSSSSBBSOO......",
      "........OSSSSSSMMSSSSSSO........",
      ".........OSSSSSSSSSSSSO.........",
      "..........OSSSSSSSSSSO..........",
      "...........OOOOssOOOO...........",
      "...............OO..............."
    ]
  },
  "body": {
    "stand": {
      "cardigan": {
        "top": 17,
        "rows": [
          "..............OOOO..............",
          ".............OSSSSO.............",
          "...........OOOssssOOO...........",
          ".......OOOOCUUUCCUUUCOOOO.......",
          "......OCCCccCUUTTUUCCCCCCO......",
          ".....OKcCCcCCkTTTTkYYCCCCKO.....",
          ".....OKcCKCCCkTTTTkYYCKCCKO.....",
          ".....OKCCKCCCkTTTTkYYCKCCKO.....",
          ".....OKCCKkkCkttttkCkkKCCKO.....",
          ".....OKCCKCCCkttttkCCCKCCKO.....",
          ".....OiiiKCCCkttttkCCCKiiiO.....",
          ".....OSSSiiiikttttkiiiiSSSO.....",
          ".....OsssOPPPPPPPPPPPPOsssO.....",
          "......OOOOPPPPPPPPPPPpOOOO......",
          ".........OPPPPPPPPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          "........OWWWWWWOOWWWWWWO........",
          "........OwwwwwwOOwwwwwwO........",
          "......GGGOOOOOOGGOOOOOOGGG......",
          ".......GGGGGGGGGGGGGGGGGG......."
        ]
      },
      "sweater": {
        "top": 17,
        "rows": [
          "..............OOOO..............",
          ".............OSSSSO.............",
          "...........OOOssssOOO...........",
          ".......OOOOCUUUCCUUUCOOOO.......",
          "......OCCCccCUUCCUUCCCCCCO......",
          ".....OKcCCcCCCCCCCCYYCCCCKO.....",
          ".....OKcCKCCCCCCCCCYYCKCCKO.....",
          ".....OKCCKCCCCCCCCCYYCKCCKO.....",
          ".....OKCCKCCCCCCCCCCCCKCCKO.....",
          ".....OKCCKCCCCCCCCCCCCKCCKO.....",
          ".....OiiiKCCCCCCCCCCCCKiiiO.....",
          ".....OSSSiiiiCCCCCCiiiiSSSO.....",
          ".....OsssOPPPPPPPPPPPPOsssO.....",
          "......OOOOPPPPPPPPPPPpOOOO......",
          ".........OPPPPPPPPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          ".........OPPPPPppPPPPpO.........",
          "........OWWWWWWOOWWWWWWO........",
          "........OwwwwwwOOwwwwwwO........",
          "......GGGOOOOOOGGOOOOOOGGG......",
          ".......GGGGGGGGGGGGGGGGGG......."
        ]
      }
    },
    "office": {
      "top": 17,
      "rows": [
        "..............OOOO..............",
        ".............OSSSSO.............",
        "...........OOOssssOOO...........",
        ".......OOOOJUUUJJUUUJOOOO.......",
        "......OJJJJJJjUKKUjJJJJJJO......",
        ".....OjJJJJJJjUCCUjJJJJJJjO.....",
        ".....OjJJjJJJjjCCjjJJJjJJjO.....",
        ".....OjJJjJJJjjCCjjJJJjJJjO.....",
        ".....OjJJjjjJjUCCUjJjjjJJjO.....",
        ".....OjJJjJJJjUCCUjJJJjJJjO.....",
        ".....OjjjjJJJjUUUUjJJJjjjjO.....",
        ".....OSSSjjjjjUUUUjjjjjSSSO.....",
        ".....OsssOJJJJJJJJJJJJOsssO.....",
        "......OOOOJJJJJJJJJJJjOOOO......",
        ".........OJJJJJJJJJJJjO.........",
        ".........OJJJJJjjJJJJjO.........",
        ".........OJJJJJjjJJJJjO.........",
        ".........OJJJJJjjJJJJjO.........",
        ".........OJJJJJjjJJJJjO.........",
        "........ORRRRRROORRRRRRO........",
        "........OrrrrrrOOrrrrrrO........",
        "......GGGOOOOOOGGOOOOOOGGG......",
        ".......GGGGGGGGGGGGGGGGGG......."
      ]
    },
    "desk": {
      "cardigan": {
        "top": 17,
        "rows": [
          "..............OOOO..............",
          ".............OSSSSO.............",
          ".OOOOOOOOOOOOOssssOOO...........",
          "OllllllllllCUUUCCUUUCOOOO.......",
          "OlLLLLLLLLLcCUUTTUUCCCCCCOOO....",
          "OlLLLLLLLLLCCkTTTTkYYCCCCKrrO...",
          "OlLLLIILLLLCCkTTTTkYYCCCCKRrO...",
          "OlLLLIILLLLCCkTTTTkYYCCCCKRrO...",
          "OlLLLLLLLLLCCkTTTTkCCCCCCKRrO...",
          "OlLLLLLLLLLCCkTTTTkCCCCCCRRrO...",
          "lllllllllllllkTTTTSSKKKKKRRrOOOO",
          "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
          "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",
          "OOrrOOOOOOOPPPPPPPPPPOOOrRRrrrOO",
          ".OrrO.....OPPPPPPPPPPO.OrrrrrrO.",
          ".OrrO.....OPPPPppPPPPO..OOOOrrO.",
          ".OrrO.....OPPPPppPPPPO.....OrrO.",
          ".OrrO.....OPPPPppPPPPO.....OrrO.",
          ".OrrO.....OPPPPppPPPPO.....OrrO.",
          ".OrrO....OWWWWWOOWWWWWO....OrrO.",
          ".OrrO....OwwwwwOOwwwwwO....OrrO.",
          "..OOGGGGGGOOOOOGGOOOOOGGGGGGOO..",
          "....GGGGGGGGGGGGGGGGGGGGGGGG...."
        ]
      },
      "sweater": {
        "top": 17,
        "rows": [
          "..............OOOO..............",
          ".............OSSSSO.............",
          ".OOOOOOOOOOOOOssssOOO...........",
          "OllllllllllCUUUCCUUUCOOOO.......",
          "OlLLLLLLLLLcCUUCCUUCCCCCCOOO....",
          "OlLLLLLLLLLCCCCCCCCYYCCCCKrrO...",
          "OlLLLIILLLLCCCCCCCCYYCCCCKRrO...",
          "OlLLLIILLLLCCCCCCCCYYCCCCKRrO...",
          "OlLLLLLLLLLCCCCCCCCCCCCCCKRrO...",
          "OlLLLLLLLLLCCCCCCCCCCCCCCRRrO...",
          "lllllllllllllCCCCCSSKKKKKRRrOOOO",
          "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
          "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",
          "OOrrOOOOOOOPPPPPPPPPPOOOrRRrrrOO",
          ".OrrO.....OPPPPPPPPPPO.OrrrrrrO.",
          ".OrrO.....OPPPPppPPPPO..OOOOrrO.",
          ".OrrO.....OPPPPppPPPPO.....OrrO.",
          ".OrrO.....OPPPPppPPPPO.....OrrO.",
          ".OrrO.....OPPPPppPPPPO.....OrrO.",
          ".OrrO....OWWWWWOOWWWWWO....OrrO.",
          ".OrrO....OwwwwwOOwwwwwO....OrrO.",
          "..OOGGGGGGOOOOOGGOOOOOGGGGGGOO..",
          "....GGGGGGGGGGGGGGGGGGGGGGGG...."
        ]
      }
    },
    "outfit": {
      "star": {
        "top": 17,
        "rows": [
          "..............OOOO..............",
          "............OOSSSSOO............",
          ".........OOOUUUUUUUUOOO.........",
          "........OCCCCCCkkCCCCCCO........",
          ".......OCccCCCkkkkCCCCCCO.......",
          "......OCCcCCCCTkkTCCCCCCCO......",
          "......OCCCCCiTTtTTTiCCCCCO......",
          ".....OCCCCCCiTTTTTTiCCCkCCO.....",
          "....OKCCCCCCittttttiCCCCCCKO....",
          "....OKCCkCCCitttUttiCCCCCCKO....",
          "....OKSSCCCCittttttiCCCCSSKO....",
          "....OKssCCCCittttttiCCCCssKO....",
          "...OCKCCCCCCiPPPPPPiCCCCCCKCO...",
          "...OiiiiiiiCiPPppPPiCiiiiiiiO...",
          "...OkkkkkkkkPPPppPPPkkkkkkkkO...",
          "....OOOOOOPPPPPppPPPPPOOOOOO....",
          "..........OSSSSOOSSSSO..........",
          ".........OTTTTTOOTTTTTO.........",
          "........OjjjVjjOOjjVjjjO........",
          "........OjjjjjjOOjjjjjjO........",
          "........OjjjjjjOOjjjjjjO........",
          "......GGGOOOOOOGGOOOOOOGGG......",
          ".......GGGGGGGGGGGGGGGGGG......."
        ]
      },
      "garden": {
        "top": 17,
        "rows": [
          "..............OOOO..............",
          ".............OSSSSO.............",
          ".......O....OOssssOO....O.......",
          "......OTOOOOUUUUUUUUOOOOTO......",
          ".....OTTTTTCCTTTTTTCCTTTTTO.....",
          "....OTTTTTTCCTTTTTTCCTTTTTTO....",
          "....OTTTTTTCccCkkCCCCTTTTTTO....",
          "....OTTTTTTCCCCCkCCCCTTTTTTO....",
          ".....OTTTTTCCCCCCCCCCTTTTTO.....",
          ".....OtttTTCCCCCCCCCCTTtttO.....",
          ".....OSSSOCCCCCCCCCCCCOSSSO.....",
          ".....OsssCCKCCCCKCCCKCCsssO.....",
          "......OOOCCKCCCCKCCCKCCOOO......",
          ".......OCCCKCCCCKCCCKCCCO.......",
          ".......OCCCKCCCCKCCCKCCCO.......",
          "......OiCCiKCiCCiCCiKCiCCO......",
          ".......OiiOiiOiiOiiOiiOiiO......",
          "........OOOTTTTOOTTTTO.OO.......",
          ".........ORRTRROORRTRRO.........",
          ".........ORRRRROORRRRRO.........",
          ".........OrrrrrOOrrrrrO.........",
          "......GGGGOOOOOGGOOOOOGGGG......",
          ".......GGGGGGGGGGGGGGGGGG......."
        ]
      }
    }
  },
  "species": {
    "cat": {
      "head": {
        "top": 1,
        "rows": [
          ".......O................O.......",
          "......OFO..............OFO......",
          "......OFFO............OFFO......",
          "......OFBFO..........OFBFO......",
          "......OFBBFOOOOOOOOOOFBBFO......",
          "......OFBBBFFFFffFFFFBBBFO......",
          ".......OOOFFfFFffFFfFFOOO.......",
          "........OFFFfFFffFFfFFFO........",
          ".......OFFFFFFFFFFFFFFFFO.......",
          "......OFFFFFFFFFFFFFFFFFFO......",
          "......OFFFFFFFFFFFFFFFFFFO......",
          "......OFFFFEEFFFFFFEEFFFFO......",
          "......OffFFEEFFFFFFEEFFffO......",
          "......OFFFFEEZZZZZZEEFFFFO......",
          "...OOO.OFBBFZZZQQZZZFBBFO.OOO...",
          ".......OFFFFZZMZZMZZFFFFO.......",
          "....OO..OFFFZZZMMZZZFFFO..OO....",
          ".........OOFFZZZZZZFFOO.........",
          "...........OOOffffOOO...........",
          "..............OOOO.............."
        ]
      },
      "tail": {
        "top": 21,
        "rows": [
          "..........................OO....",
          ".........................OFFO...",
          ".........................OFFO...",
          "..........................OFFO..",
          "..........................OffO..",
          "..........................OFFO..",
          "..........................OFFO..",
          "..........................OFFO..",
          ".........................OffFO..",
          ".........................OFFO...",
          "........................OFFFO...",
          ".....................OOOffFO....",
          "....................OFFFFFO.....",
          "....................OFFFFO......",
          ".....................OOOO......."
        ]
      }
    },
    "puppy": {
      "head": {
        "top": 3,
        "rows": [
          ".............OO.OO..............",
          "............OFFOFFO.............",
          "...........OFFFFFFOOO...........",
          ".....OOO..OFFFFZZFFFFO..OOO.....",
          "....OfffOOFFFFFZZFFFFFOOfffO....",
          "...OffffOFFFFFFZZFFFFFFOffffO...",
          "...OfffffFFFFFFZZFFFFFFfffffO...",
          "...OfffffFFFFFFZZFFFFFFfffffO...",
          "...OfffffFFFFFFZZFFFFFFfffffO...",
          "...OfffffFFEEFFZZFFEEFFfffffO...",
          "...OfffffFFEEFFFFFFEEFFfffffO...",
          "...OfffffFFEEZZZZZZEEFFfffffO...",
          "...OfffffFFFZZEEEEZZFFFfffffO...",
          "...OfffffBBFZZZEEZZZFBBfffffO...",
          "...OrffffOFFZZMZZMZZFFOffffrO...",
          "....OfffO.OFFZZQQZZFFO.OfffO....",
          ".....OfO...OOFFFFFFOO...OfO.....",
          "......O......OOOOOO......O......"
        ]
      },
      "tail": {
        "top": 25,
        "rows": [
          "..........................OO....",
          ".........................OZZO...",
          ".........................OFFO...",
          ".........................OFFO...",
          "........................OFFFO...",
          ".....................OOOFFFO....",
          "....................OFFFFFO.....",
          "....................OFFFFO......",
          ".....................OOOO......."
        ]
      }
    }
  },
  "hair": {
    "short": {
      "front": {
        "top": 0,
        "rows": [
          "............OOOOHHOO............",
          ".........OOOHHHHHHHHOOO.........",
          "........OHHHHHHHHHHHHHHO........",
          "......OOHHHHHhHHHHHhhHHHOO......",
          ".....OHHHHHhhHHHHHHHHhHHHHO.....",
          ".....OHHHHhHHHHhHHHHHHhHHHO.....",
          "....OHHHHhHHHHhHHHdHHHHHHHHO....",
          "....OHHHhHHHHHHHHdHddHHhHHHO....",
          "....OHHHHHHHHHHHHHd.ddHHhHHO....",
          "....OHHHHHHHHdHddd...ddHHHHO....",
          "....OHHHHHdddddd......ddHHHO....",
          ".....OHHddddd.d........dHHO.....",
          "......dHdd.............dHd......",
          "......ddd..............ddd......",
          ".......d................d......."
        ]
      }
    },
    "bob": {
      "front": {
        "top": 1,
        "rows": [
          "............OOOOOOOO............",
          "..........OOHHHHHHHHOO..........",
          ".........OHHhhHHHHhhHHO.........",
          "........OHhhHHHHHHHHhhHO........",
          ".......OHhHHHHHHHHHHHHhHO.......",
          "......OHHHHHHHHHHHHHHHHHHO......",
          ".....OHHHHHHHHHHHHHHHHHHHHO.....",
          ".....OHHHHHHHdHHHHHdHHHHHHO.....",
          ".....OHhHHHHHdHHHHHdHHHHhHO.....",
          ".....OHhHddddddddddddddHhHO.....",
          ".....OHHHdddd.ddddd.dddHHHO.....",
          ".....dHHHd............dHHHd.....",
          ".....dHHHd............dHHHd.....",
          ".....dHHHd............dHHHd.....",
          ".....OHHHd............dHHHO.....",
          ".....OHHdd............ddHHO.....",
          ".....OHHdd............ddHHO.....",
          "......OdHO............OHdO......",
          ".......OO..............OO......."
        ]
      }
    },
    "long": {
      "front": {
        "top": 0,
        "rows": [
          "..............OOOO..............",
          "..........OOOOHHHHOOOO..........",
          ".........OHHHHHHHHHHHHO.........",
          ".......OOHHhHHHHHHHHhHHOO.......",
          "......OHHHhHHHHHHHHHHhHHHO......",
          ".....OHHHhHHHHHddHHHHHhHHHO.....",
          ".....OHHHHHHHHHHHHHHHHHHHHO.....",
          "....OHHHHHHHHHHddHHHHHHHHHHO....",
          "....OHHHHHHHHHd..dHHHHHHHHHO....",
          "....OHHHHHHHHd....dHHHHHHHHO....",
          "...OHHHHHHHHd......dHHHHHHHHO...",
          "....OHHHHHHd........dHHHHHHO....",
          "....OHHHdHd..........dHdHHHO....",
          ".....dHHHd............dHHHd.....",
          ".....dhHHd............dHHHd.....",
          ".....OHHHd............dHHhO.....",
          ".....OHHdd............ddHHO.....",
          "....OHHHHd............dHHHHO....",
          "...OHHhHO..............OHHHHO...",
          "...OHHHHO..............OHhHHO...",
          "...OHHHHO..............OHHHHO...",
          "...OHHHHO..............OHHHHO...",
          "....OHHdHO............OHdHHO....",
          "....OHHHHO............OHHHHO....",
          ".....OOOO..............OOOO....."
        ]
      },
      "back": {
        "top": 11,
        "rows": [
          "...OOOOOOOOOOOOOOOOOOOOOOOOOO...",
          "..OHHHHHHHHHHHHHHHHHHHHHHHHHHO..",
          "...OHHHHHHHHHHHHHHHHHHHHHHHHO...",
          "...OHHHHHHHHHHHHHHHHHHHHHHHHO...",
          "....OHHHHHHHHHHHHHHHHHHHHHHO....",
          "....OHHHHHHHHHHHHHHHHHHHHHHO....",
          "....OHHHHHHHHHHHHHHHHHHHHHHO....",
          "....OHHHHHHHHHHHHHHHHHHHHHHO....",
          "...OHHHHHHHHHHHHHHHHHHHHHHHHO...",
          "...OhHHHHHHHHHHHHHHHHHHHHHHHO...",
          "..OHHHHHHHHHHHHHHHHHHHHHHHHHHO..",
          "..OHHHHHHHHHHHHHHHHHHHHHHHHhHO..",
          "..OHHHHHHHHHHHHHHHHHHHHHHHHHHO..",
          "..OHHHHHHHHHHHHHHHHHHHHHHHHHHO..",
          "..OHHHHHHHHHHHHHHHHHHHHHHHHHHO..",
          "...OHhHHHHHHHHHHHHHHHHHHHHHHO...",
          "....OHHHHHHHHHHHHHHHHHHHHHHO....",
          ".....OOHHHHHHHHHHHHHHHHHHOO.....",
          ".......OHHHHHHHHHHHHHHHHO.......",
          "........OOOOOOOOOOOOOOOO........"
        ]
      }
    },
    "curly": {
      "front": {
        "top": 0,
        "rows": [
          "........OHHHHHhhHHhhHOOO........",
          ".......OHHhhHHHHHHHHHHHHO.......",
          "......OHHHHHHHHHHHHHHhhHHO......",
          ".....OHHHHHHHHHddHHddHHHHOO.....",
          "....OHHhhHHddHHHHHHHHHHHHHHO....",
          "...OHHHHHHHHHHHHHHHHHHddhhHHO...",
          "...OHHHHHHHHHHHHHHHHHHHHHHHHO...",
          "....OHHHddHHHHHHHHHHHHHHHHHHO...",
          "...OHHhhHHHHHHHHHHHHHHHHHddHO...",
          "..OHHHHHHHHHHHHddHdHHHHHHHHHHO..",
          "..OHHHHHHddddddddd.ddddHHHHHHO..",
          "...OHHHdddddd.......dddHHHddO...",
          "...OHhhHHd............dHHhhHO...",
          "..OHHHHHHd............dHHHHHHO..",
          "..OHHHHHHd............dHHHHHHO..",
          "...OHHddHd............dHHHddO...",
          "....OHHHd..............dHHHO....",
          ".....OOO................OOO....."
        ]
      }
    },
    "ponytail": {
      "front": {
        "top": 0,
        "rows": [
          "..............OOOO..............",
          "..........OOOOHHHHOOOO..........",
          ".........OHHHHHHHHHHHHO.........",
          ".......OOHHhhHHHHHHhHHHOO.......",
          "......OHHHhHHHHHHHHHhhHHHO......",
          "......OHHhHHHHHHHHHHHHhHHO......",
          ".....OHHHHHHHHHHHHHHHHHHHHO.....",
          ".....OHHHHHHHHHHHHHHHHHHYYO.....",
          "....OHHHHHHHdddddHdHHHHHYYHO....",
          "....OHHHHHdddd...ddddHHHHHHO....",
          ".....OHHHddd.......ddddHHHO.....",
          ".....OHHdd...........dddHHO.....",
          "......dHd..............dHd......",
          ".......d................d......."
        ]
      },
      "back": {
        "top": 4,
        "rows": [
          ".........................OO.....",
          ".......................OOHHOO...",
          "......................OHHHHHHO..",
          "......................OHHHHHHO..",
          ".......................OHHHHHHO.",
          ".......................OHHHhHHO.",
          "........................OHHHHHHO",
          "........................OHHHHHHO",
          "........................OHHHhHHO",
          "........................OHHHHHHO",
          ".........................OHHHHO.",
          ".........................OHHHHO.",
          "........................OHHHdO..",
          "........................OHHHHO..",
          ".........................OHdO...",
          ".........................OHHO...",
          "..........................OO...."
        ]
      }
    },
    "twin": {
      "front": {
        "top": 0,
        "rows": [
          "..............OOOO..............",
          "..........OOOOHHHHOOOO..........",
          ".........OHHHHHHHHHHHHO.........",
          ".......OOHHhHHHHHHHHhHHOO.......",
          "......OHHHhHHHHHHHHHHhHHHO......",
          ".....OHHHhHHHHHHHHHHHHhHHHO.....",
          ".....OHHHHHHHHHHHHHHHHHHHHO.....",
          "....OHHHHHHHHHHddHHHHHHHHHHO....",
          "....OHHHHHHHHddddddHHHHHHHHO....",
          "....OHHHHHHdddd..ddddHHHHHHO....",
          "....OHHHHdddd......ddddHHHHO....",
          ".....OHHHdd..........ddHHHO.....",
          ".....dHHd..............dHHd.....",
          "....OYYHd..............dHYYO....",
          "....OYYd................dYYO....",
          ".....Od..................dO....."
        ]
      },
      "back": {
        "top": 13,
        "rows": [
          "...OOO.....................OOO..",
          "..OHHHO...................OHHHO.",
          "..OHHHO...................OHHHO.",
          "..OhHHO...................OHHHO.",
          ".OHHHO.....................OhHHO",
          ".OHHHO.....................OHHHO",
          ".OHHHO.....................OHHHO",
          ".OHHHO.....................OHHHO",
          "..OHHHO...................OHHHO.",
          "..OHHHO...................OHHHO.",
          "..OHHHO...................OHHHO.",
          "..OHHO....................OHHO..",
          "...OHHO..................OHHO...",
          "...OHHO..................OHHO...",
          "...OHHO..................OHHO...",
          "....OO....................OO...."
        ]
      }
    }
  },
  "glasses": {
    "round": {
      "top": 11,
      "rows": [
        "..........gggg....gggg..........",
        "......gggg....gggg....gggg......",
        ".........g....g..g....g.........",
        ".........g....g..g....g.........",
        "..........gggg....gggg.........."
      ]
    },
    "square": {
      "top": 11,
      "rows": [
        ".........xxxxxx..xxxxxx.........",
        "......xxxx....xxxx....xxxx......",
        ".........x....x..x....x.........",
        ".........xxxxxx..xxxxxx........."
      ]
    },
    "sun": {
      "top": 11,
      "rows": [
        "......zzzzzzzzzzzzzzzzzzzz......",
        "......zzzIzzzzz..zIzzzzzzz......",
        "........zzzzzzz..zzzzzzz........",
        ".........zzzzz....zzzzz........."
      ]
    }
  },
  "hat": {
    "cap": {
      "top": 0,
      "rows": [
        "...........OOOOOOOOO............",
        "........OOOAAAAYAAAAOOO.........",
        ".......OAAAAAAAaAAAAAAAO........",
        "......OAAccAAAAaAAAAAAAAO.......",
        ".....OAAAcAYYAAaAAAAAAAAAO......",
        "....OAAAAAAYYAAaAAAAAAAAAAO.....",
        "....OAAAAAAAAAAaAAAAAAAAAAOOOOO.",
        "....OaaaaaaaaaaaaaaaaaaaaaaaaaaO",
        ".....OOOOOOOOOOOOOaaaaaaaaaaaaO.",
        "..................OOOOOOOOOOOO.."
      ]
    },
    "ribbon": {
      "top": 0,
      "rows": [
        "...................OO.OO........",
        "..................OQQOQQO.......",
        ".................OQqQQQqQO......",
        ".................OQQQqQQQO......",
        "..................OQOOOQO.......",
        "...................O...O........"
      ]
    },
    "beanie": {
      "top": 0,
      "rows": [
        "...........OOOTTTTOOO...........",
        "........OOONNNTTTTNNNOOO........",
        ".......ONNNNNNNNNNNNNNNNO.......",
        "......ONNNNNNNNNNNNNNNNNNO......",
        ".....ONNNNNNNNNNNNNNNNNNNNO.....",
        "....ONNNNNNNNNNNNNNNNNNNNNNO....",
        "....ONNNNNNNNNNNNNNNNNNNNNNO....",
        "....OnNnNnNnNnNnNnNnNnNnNnnO....",
        "....OnNnNnNnNnNnNnNnNnNnNnnO....",
        "....OnNnNnNnNnNnNnNnNnNnNnnO....",
        ".....OOONNNNNNNNNNNNNNNNOOO.....",
        "........OONNNNNNNNNNNNOO........",
        "..........OOOOOOOOOOOO.........."
      ]
    },
    "crown": {
      "top": 0,
      "rows": [
        "..........OVO..OVO..O...........",
        "..........OVVOOVVVOOVO..........",
        "..........OVVVVVVVVVVO..........",
        "..........OVXVVVXVVXVO..........",
        "..........OvvvvvvvvvvO..........",
        "...........OOOOOOOOOO..........."
      ]
    },
    "star": {
      "top": 0,
      "rows": [
        "...........OOOOOOOOO............",
        "........OOOJJJJJJJJJOOO.........",
        ".......OJjjJJJJJJJJJJJJOO.......",
        "......OJJjJJJJJJJJVJjjjjJOO.....",
        ".....OJJJJJJJJJJJJJJJJJJJJJO....",
        "....OJJJJJJJVJJJJJJJJJJJJJJJO...",
        "....OJJJJJJJJJJJJJJJJJVJJJJJO...",
        "....OJJJJJJJJJJJJJJJJJJJJJOJJO..",
        "....OvVVVVVVVVVVVVVVVVVVVVvJJO..",
        ".....OOOOOOOOOOOOOOOOOOOOOOOvO..",
        "..........................OVVVO.",
        "...........................OVO..",
        "............................O..."
      ]
    },
    "bonnet": {
      "top": 0,
      "rows": [
        ".............OOOOOO.............",
        "..........OOOTTTTTTOOO..........",
        "........OOTTTTTTTTTTTTOO........",
        ".......OTTttTTTTTTTTTTTTO.......",
        ".......OTTtTTTTTTTTTTQTTO.......",
        "......OTTTTTTTTTTTNTQVQTQO......",
        "....OOONNNNNNNNNNNNNNQNQVQOO....",
        "...OTTTnnnnnnnnnnnnnnnQnQnTTO...",
        "..OTTTTTTTTTTTTTTTTTTQVQTTTTTO..",
        "...OOtttttttttttttttttQttttOO...",
        ".....OOOOOOOOTTTTTTOOOOOOONNO...",
        ".............OOOOOO.......ONO...",
        "..........................OnO...",
        ".........................ONNO...",
        "..........................OO...."
      ]
    }
  },
  "prop": {
    "pen": {
      "top": 18,
      "rows": [
        "......O.........................",
        ".....OEO........................",
        "....OTTTO.......................",
        "....OYYvO................O......",
        "....OYYvO.............OOOAOOO...",
        "....OYYvO............OrRRARRRO..",
        "....OYYvO............OrRRARRTO..",
        "....OYYvO............OrRRARRTO..",
        "....OYYvO............OrRRRRRTO..",
        "....OYYvO............OrRRRRRTO..",
        "....OYYvO............OrRRRRRTO..",
        "....OQQQO............OrRRRRRTO..",
        ".....OOO.............OrRRRRRRO..",
        "......................OOOOOOO..."
      ]
    },
    "mug": {
      "top": 22,
      "rows": [
        "......................OOOOOO....",
        ".....................OttttttOO..",
        ".....................OTTTTTTTTO.",
        ".....................OTTAATTOTO.",
        ".....................OTTAATTOTO.",
        ".....................OTTAATTTTO.",
        ".....................OTTTTTTOO..",
        ".....................OttttttO...",
        ".....................OttttttO...",
        "......................OOOOOO...."
      ]
    },
    "plant": {
      "top": 18,
      "rows": [
        "....O.O.........................",
        "...ONONO........................",
        "..ONNNNnO.......................",
        ".ONNnNNNO.......................",
        "..ONNNnO........................",
        "..OOnNOOO.......................",
        ".ORRRRRRRO......................",
        ".OrrrrrrrO......................",
        "..OrRRRRO.......................",
        "..OrRRRRO.......................",
        "..OrRRRRO.......................",
        "..OrRRRRO.......................",
        "..OrRRRRO.......................",
        "...OOOOO........................"
      ]
    },
    "moonbook": {
      "top": 21,
      "rows": [
        "......................OOOOOOO...",
        ".....................OjJJJJVJO..",
        ".....................OjJJJJJTO..",
        ".....................OjJJVVJTO..",
        ".....................OjJVJJJTO..",
        ".....................OjJVJJJTO..",
        ".....................OjJJVVJTO..",
        ".....................OjJJJJJTO..",
        ".....................OjJJJJJTO..",
        ".....................OjJJJJVJO..",
        "......................OOOOOOO..."
      ]
    },
    "quill": {
      "top": 13,
      "rows": [
        ".O..............................",
        "OTOOO...........................",
        "OlTLTO..........................",
        "TTTLlO..........................",
        "lTTLTTO.........................",
        "OTTTLTlO........................",
        "OlTTLTTO........................",
        "OTTTLTlO........................",
        ".OOlTLTTO.......................",
        "..OTTLlO........................",
        "...OlLTO........................",
        "....OOLO........................",
        ".....OLO........................",
        ".....OLO........................",
        "......OLO.......................",
        ".......O........................",
        ".......O........................",
        "......OVO.......................",
        ".......O........................"
      ]
    },
    "can": {
      "top": 21,
      "rows": [
        "........................OOO.....",
        ".......................OvvvO..OO",
        "......................OvOOOvOOVV",
        "......................OvOOOvO.Ov",
        ".....................OVVVVVVVOvO",
        ".....................OVVVNVVVvO.",
        ".....................OVVNnVVVO..",
        ".....................OVVVVVVVO..",
        ".....................OvvvvvvvO..",
        ".....................OvvvvvvvO..",
        "......................OOOOOOO..."
      ]
    }
  },
  "scene": {
    "stars": {
      "top": 1,
      "rows": [
        ".....V..........................",
        "................................",
        "..V.............................",
        ".VVV............................",
        "..V.........................V...",
        "...........................VVV..",
        "............................V...",
        "................................",
        "................................",
        "................................",
        "..............................V.",
        "................................",
        "................................",
        "................................",
        "................................",
        ".V..............................",
        "VVV.............................",
        ".V...........................V..",
        "............................VVV.",
        ".............................V..",
        "................................",
        "................................",
        "...V............................",
        "................................",
        ".............................V..",
        "................................",
        "................................",
        "................................",
        "...V............................",
        "..VVV.......................V...",
        "...V.......................VVV..",
        "............................V..."
      ]
    },
    "sunrise": {
      "top": 1,
      "rows": [
        ".........................vVvv...",
        "........................VVVVVv..",
        ".......................VVVVVVVv.",
        ".......................VVVVVVVv.",
        "......................vVVVVVVVvv",
        ".......................VVVVVVVv.",
        ".......................vVVVVVvv.",
        "........................vvVvvv..",
        ".........................vvvv...",
        "................................",
        "................................",
        "................................",
        "................................",
        ".ll.............................",
        "llllll..........................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "............................ll..",
        "..........................llllll"
      ]
    },
    "party": {
      "top": 0,
      "rows": [
        "............V...................",
        ".......QQ...........A...........",
        "..AA.......................NN...",
        "................................",
        "................................",
        "................................",
        "................................",
        "..............................VV",
        "................................",
        ".VV.............................",
        "................................",
        "................................",
        "..........................NN....",
        "................................",
        "....AA.......................QQ.",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "NN..............................",
        "................................",
        "..............................AA",
        "................................",
        "................................",
        "................................",
        "................................",
        "...QQ...........................",
        "................................",
        "............................VV..",
        "................................",
        "................................",
        "................................",
        ".N..............................",
        "..............................Q."
      ]
    }
  }
} satisfies {
  head: Sprite
  body: {
    stand: { cardigan: Sprite; sweater: Sprite }
    office: Sprite
    desk: { cardigan: Sprite; sweater: Sprite }
    outfit: Record<string, Sprite>
  }
  species: Record<string, { head: Sprite; tail: Sprite }>
  hair: Record<string, HairArt>
  glasses: Record<string, Sprite>
  hat: Record<string, Sprite>
  prop: Record<string, Sprite>
  scene: Record<string, Sprite>
}
