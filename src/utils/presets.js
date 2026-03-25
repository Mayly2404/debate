import { CREDIT_DEFAULT, uid } from './helpers';

const round = (name, durationSec) => ({
  id: uid(),
  name,
  durationSec,
  showMotion: true,
  showRound: true,
  supportSpeaker: { name: 'Thí sinh ủng hộ', avatar: '' },
  opposeSpeaker: { name: 'Thí sinh phản đối', avatar: '' },
  allowSupportBell: true,
  allowOpposeBell: true,
  allowQuestionBell: true,
  questionDurationSec: 30
});

export const PRESETS = {
  teen: {
    name: 'Teen style',
    motionName: 'Các cuộc thi mang tính cạnh tranh dành cho học sinh cần được chấm dứt.',
    teamSupportName: 'Ủng hộ',
    teamOpposeName: 'Phản đối',
    scoreScale: 100,
    scoreMapping: true,
    mappedScale: 10,
    judgeWeight: 70,
    groupWeight: 30,
    scoreCriteria: [
      { name: 'Lập luận', max: 10, weight: 30 },
      { name: 'Phản biện', max: 10, weight: 25 },
      { name: 'Dẫn chứng', max: 10, weight: 20 },
      { name: 'Thuyết trình', max: 10, weight: 15 },
      { name: 'Phối hợp', max: 10, weight: 10 }
    ],
    rounds: [round('Trình bày lượt 1', 300), round('Đối chất', 180), round('Kết luận', 180)]
  },
  ap: {
    name: 'AP style',
    motionName: 'Tranh luận nên được đánh giá ngang bằng với viết luận trong nhà trường.',
    teamSupportName: 'Affirmative',
    teamOpposeName: 'Negative',
    scoreScale: 100,
    scoreMapping: true,
    mappedScale: 100,
    judgeWeight: 80,
    groupWeight: 20,
    scoreCriteria: [
      { name: 'Claim', max: 10, weight: 30 },
      { name: 'Evidence', max: 10, weight: 25 },
      { name: 'Crossfire', max: 10, weight: 25 },
      { name: 'Delivery', max: 10, weight: 20 }
    ],
    rounds: [round('Constructive', 240), round('Crossfire', 180), round('Final focus', 120)]
  }
};

export function createDefaultState() {
  const preset = PRESETS.teen;
  return {
    auth: {
      hostUser: 'peace',
      hostPass: 'HuyHuy2404',
      teacherPass: 'admin123@'
    },
    ui: {
      masterVolume: 0.8,
      marqueeEnabled: true,
      marqueeText: CREDIT_DEFAULT,
      teenMode: true,
      showMotionOnDisplay: true,
      showRoundOnDisplay: true,
      showScoreOverlay: true,
      showJudgeNamesInStats: true
    },
    media: {
      sounds: {
        start: '',
        pause: '',
        stop: '',
        bellSelf: '',
        bellOpponent: '',
        acceptQuestion: '',
        rejectQuestion: '',
        scoreSubmit: '',
        statsSubmit: '',
        intro: '',
        toggleOverlay: ''
      }
    },
    config: {
      eventDate: new Date().toISOString().slice(0, 10),
      motionName: preset.motionName,
      teamSupportName: preset.teamSupportName,
      teamOpposeName: preset.teamOpposeName,
      judgeNames: ['Giám khảo 1', 'Giám khảo 2', 'Giám khảo 3'],
      groupNames: ['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4'],
      scoreMode: 'hybrid',
      scoreScale: preset.scoreScale,
      scoreMapping: preset.scoreMapping,
      mappedScale: preset.mappedScale,
      judgeWeight: preset.judgeWeight,
      groupWeight: preset.groupWeight,
      scoreCriteria: preset.scoreCriteria,
      rounds: preset.rounds,
      bellCooldownSec: 3,
      globalQuestionDurationSec: 30,
      scoringWindowEnabled: true,
      scoringWindowSec: 90,
      statsWindowEnabled: true,
      statsWindowSec: 90
    },
    runtime: {
      preset: 'teen',
      status: 'idle',
      currentRoundIndex: 0,
      roundRemainingSec: preset.rounds[0].durationSec,
      endAt: null,
      timerBaseRemainingSec: preset.rounds[0].durationSec,
      bellOpen: true,
      questionBellOpen: true,
      scoringOpen: false,
      statsOpen: false,
      scoringDeadlineAt: null,
      statsDeadlineAt: null,
      acceptedBellId: null,
      pendingQuestionFor: null,
      activeQuestion: null,
      introVisible: true,
      showMotion: true,
      showRound: true,
      statsVisible: false,
      statsPhase: 'before'
    },
    bells: [],
    scores: { submissions: {} },
    stats: { submissions: {} },
    history: []
  };
}
