export type DialogueCharacter = "rowan" | "dawn" | "lucas" ;

export type TutorialStep =
  | {
      type: "dialogue";
      speaker: string;
      message: string;
      character?: DialogueCharacter;
      showUsername?: boolean;
    }
  | {
      type: "gender-selection";
    }
  | {
      type: "name-input"
    }
  | {
      type: "favortie-region"
    }
  |
    {
      type: "give-poke-ball" 
    }

export const dialogueSteps: TutorialStep[] = [
  {
    type: "dialogue",
    speaker: "마박사",
    message: "포켓몬의 세계에 온 것을 환영한다!",
    character: "rowan",
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "사람들은 포켓몬과 함께 살아가고 있단다.",
    character: "rowan",
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "우선 네 모습을 알려주겠니?",
    character: "rowan",
  },
  {
    type: "gender-selection",
  },
  {
    type: "name-input"
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "앞으로 잘 부탁한다.",
    character: "rowan",
    showUsername: true,
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "앞으로 잘 부탁한다.",
    character: "rowan",
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "어느 지방을 제일 좋아하니 선택해보렴!",
    character: "rowan",
  },
  {
    type: "favortie-region"
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "좋은 선택이구나!",
    character: "rowan",
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "첫 스타팅 포켓몬을 받은 기념으로, 몬스터볼 10개를 선물로 주겠다.",
    character: "rowan",
  },
  {
    type: "give-poke-ball", 
  },
  {
    type: "dialogue",
    speaker: "마박사",
    message: "자 이제 포켓몬을 잡으며, 동료들과 강해지거라!",
    character: "rowan",
  },
];