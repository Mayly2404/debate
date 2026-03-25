import { useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEY, clone, now, normalizeScore, uid } from '../utils/helpers';
import { PRESETS, createDefaultState } from '../utils/presets';

export function useSyncedState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : createDefaultState();
    } catch {
      return createDefaultState();
    }
  });
  const bcRef = useRef(null);

  useEffect(() => {
    const bc = new BroadcastChannel('debate-raccoon-v2-channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'state') {
        setState((prev) => (JSON.stringify(prev) === JSON.stringify(event.data.payload) ? prev : event.data.payload));
      }
    };
    bcRef.current = bc;
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) setState(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      bc.close();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    bcRef.current?.postMessage({ type: 'state', payload: state });
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        let changed = false;
        const next = clone(prev);
        if (next.runtime.status === 'running' && next.runtime.endAt) {
          const remaining = Math.max(0, Math.ceil((next.runtime.endAt - now()) / 1000));
          if (remaining !== next.runtime.roundRemainingSec) {
            next.runtime.roundRemainingSec = remaining;
            changed = true;
          }
          if (remaining <= 0) {
            next.runtime.status = 'ended';
            next.runtime.endAt = null;
            next.history.unshift({ id: uid(), ts: now(), label: 'Hết giờ lượt hiện tại' });
            changed = true;
          }
        }
        if (next.runtime.activeQuestion?.endAt) {
          const remaining = Math.max(0, Math.ceil((next.runtime.activeQuestion.endAt - now()) / 1000));
          if (remaining !== next.runtime.activeQuestion.remainingSec) {
            next.runtime.activeQuestion.remainingSec = remaining;
            changed = true;
          }
          if (remaining <= 0) {
            next.runtime.activeQuestion = null;
            next.runtime.pendingQuestionFor = null;
            next.history.unshift({ id: uid(), ts: now(), label: 'Hết giờ đặt câu hỏi' });
            changed = true;
          }
        }
        if (next.runtime.scoringOpen && next.runtime.scoringDeadlineAt && now() > next.runtime.scoringDeadlineAt) {
          next.runtime.scoringOpen = false;
          next.runtime.scoringDeadlineAt = null;
          next.history.unshift({ id: uid(), ts: now(), label: 'Tự động khóa chấm điểm' });
          changed = true;
        }
        if (next.runtime.statsOpen && next.runtime.statsDeadlineAt && now() > next.runtime.statsDeadlineAt) {
          next.runtime.statsOpen = false;
          next.runtime.statsDeadlineAt = null;
          next.history.unshift({ id: uid(), ts: now(), label: 'Tự động khóa thống kê' });
          changed = true;
        }
        return changed ? next : prev;
      });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const actions = useMemo(() => ({
    patch(updater) {
      setState((prev) => (typeof updater === 'function' ? updater(clone(prev)) : { ...prev, ...updater }));
    },
    applyPreset(key) {
      const preset = PRESETS[key] || PRESETS.teen;
      setState((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          motionName: preset.motionName,
          teamSupportName: preset.teamSupportName,
          teamOpposeName: preset.teamOpposeName,
          scoreScale: preset.scoreScale,
          scoreMapping: preset.scoreMapping,
          mappedScale: preset.mappedScale,
          judgeWeight: preset.judgeWeight,
          groupWeight: preset.groupWeight,
          scoreCriteria: clone(preset.scoreCriteria),
          rounds: clone(preset.rounds)
        },
        runtime: {
          ...prev.runtime,
          preset: key,
          currentRoundIndex: 0,
          roundRemainingSec: preset.rounds[0].durationSec,
          timerBaseRemainingSec: preset.rounds[0].durationSec,
          endAt: null,
          introVisible: true,
          status: 'idle'
        }
      }));
    },
    setConfig(path, value) {
      setState((prev) => ({ ...prev, config: { ...prev.config, [path]: value } }));
    },
    setUi(path, value) {
      setState((prev) => ({ ...prev, ui: { ...prev.ui, [path]: value } }));
    },
    setSound(name, value) {
      setState((prev) => ({ ...prev, media: { ...prev.media, sounds: { ...prev.media.sounds, [name]: value } } }));
    },
    updateRound(roundId, patch) {
      setState((prev) => ({
        ...prev,
        config: { ...prev.config, rounds: prev.config.rounds.map((r) => (r.id === roundId ? { ...r, ...patch } : r)) }
      }));
    },
    addRound() {
      setState((prev) => ({
        ...prev,
        config: {
          ...prev.config,
          rounds: [...prev.config.rounds, {
            id: uid(),
            name: `Lượt ${prev.config.rounds.length + 1}`,
            durationSec: 180,
            showMotion: true,
            showRound: true,
            supportSpeaker: { name: 'Thí sinh ủng hộ', avatar: '' },
            opposeSpeaker: { name: 'Thí sinh phản đối', avatar: '' },
            allowSupportBell: true,
            allowOpposeBell: true,
            allowQuestionBell: true,
            questionDurationSec: prev.config.globalQuestionDurationSec
          }]
        }
      }));
    },
    removeRound(roundId) {
      setState((prev) => {
        const rounds = prev.config.rounds.filter((r) => r.id !== roundId);
        return { ...prev, config: { ...prev.config, rounds: rounds.length ? rounds : prev.config.rounds } };
      });
    },
    startRound() {
      setState((prev) => ({
        ...prev,
        runtime: {
          ...prev.runtime,
          status: 'running',
          introVisible: false,
          endAt: now() + prev.runtime.roundRemainingSec * 1000
        },
        history: [{ id: uid(), ts: now(), label: 'Bắt đầu lượt' }, ...prev.history]
      }));
    },
    pauseRound() {
      setState((prev) => ({
        ...prev,
        runtime: { ...prev.runtime, status: 'paused', endAt: null },
        history: [{ id: uid(), ts: now(), label: 'Tạm dừng lượt' }, ...prev.history]
      }));
    },
    stopRound() {
      setState((prev) => ({
        ...prev,
        runtime: { ...prev.runtime, status: 'ended', endAt: null, roundRemainingSec: 0 },
        history: [{ id: uid(), ts: now(), label: 'Kết thúc lượt' }, ...prev.history]
      }));
    },
    resetRound() {
      setState((prev) => {
        const round = prev.config.rounds[prev.runtime.currentRoundIndex];
        return {
          ...prev,
          runtime: {
            ...prev.runtime,
            status: 'idle',
            introVisible: true,
            roundRemainingSec: round.durationSec,
            timerBaseRemainingSec: round.durationSec,
            endAt: null
          }
        };
      });
    },
    goRound(direction) {
      setState((prev) => {
        const nextIndex = Math.max(0, Math.min(prev.config.rounds.length - 1, prev.runtime.currentRoundIndex + direction));
        const round = prev.config.rounds[nextIndex];
        return {
          ...prev,
          runtime: {
            ...prev.runtime,
            currentRoundIndex: nextIndex,
            status: 'idle',
            introVisible: true,
            roundRemainingSec: round.durationSec,
            timerBaseRemainingSec: round.durationSec,
            endAt: null,
            activeQuestion: null,
            pendingQuestionFor: null
          }
        };
      });
    },
    setRoundRemaining(sec) {
      setState((prev) => ({ ...prev, runtime: { ...prev.runtime, roundRemainingSec: sec, timerBaseRemainingSec: sec, endAt: prev.runtime.status === 'running' ? now() + sec * 1000 : null } }));
    },
    toggleGate(name, value) {
      setState((prev) => {
        const next = clone(prev);
        next.runtime[name] = value;
        if (name === 'scoringOpen') next.runtime.scoringDeadlineAt = value && next.config.scoringWindowEnabled ? now() + next.config.scoringWindowSec * 1000 : null;
        if (name === 'statsOpen') next.runtime.statsDeadlineAt = value && next.config.statsWindowEnabled ? now() + next.config.statsWindowSec * 1000 : null;
        next.history.unshift({ id: uid(), ts: now(), label: `${name} -> ${value ? 'mở' : 'đóng'}` });
        return next;
      });
    },
    pushBell(team, kind) {
      setState((prev) => {
        const round = prev.config.rounds[prev.runtime.currentRoundIndex];
        const allow = kind === 'question'
          ? prev.runtime.questionBellOpen && round.allowQuestionBell
          : prev.runtime.bellOpen && ((team === 'support' && round.allowSupportBell) || (team === 'oppose' && round.allowOpposeBell));
        if (!allow) return prev;
        return {
          ...prev,
          bells: [{ id: uid(), team, kind, ts: now(), status: 'pending' }, ...prev.bells].slice(0, 30),
          history: [{ id: uid(), ts: now(), label: `${team} gửi ${kind}` }, ...prev.history]
        };
      });
    },
    acceptBell(id, accepted) {
      setState((prev) => {
        const targetBell = prev.bells.find((b) => b.id === id);
        if (!targetBell) return prev;
        const round = prev.config.rounds[prev.runtime.currentRoundIndex];
        const next = clone(prev);
        next.bells = next.bells.map((b) => b.id === id ? { ...b, status: accepted ? 'accepted' : 'rejected' } : b);
        next.runtime.acceptedBellId = accepted ? id : null;
        if (accepted && targetBell.kind === 'question') {
          next.runtime.pendingQuestionFor = targetBell.team;
          next.runtime.activeQuestion = {
            targetTeam: targetBell.team,
            remainingSec: round.questionDurationSec || next.config.globalQuestionDurationSec,
            endAt: now() + (round.questionDurationSec || next.config.globalQuestionDurationSec) * 1000
          };
        }
        next.history.unshift({ id: uid(), ts: now(), label: `${accepted ? 'Chấp nhận' : 'Từ chối'} chuông ${targetBell.kind}` });
        return next;
      });
    },
    clearBells() {
      setState((prev) => ({ ...prev, bells: [] }));
    },
    submitScore(name, payload) {
      setState((prev) => ({
        ...prev,
        scores: { submissions: { ...prev.scores.submissions, [name]: { ...payload, submittedAt: now() } } }
      }));
    },
    submitStats(name, payload) {
      setState((prev) => ({
        ...prev,
        stats: { submissions: { ...prev.stats.submissions, [name]: { ...payload, submittedAt: now() } } }
      }));
    }
  }), []);

  const scoreSummary = useMemo(() => {
    const items = Object.values(state.scores.submissions);
    const criteria = state.config.scoreCriteria;
    const judgeSet = new Set(state.config.judgeNames);
    const groupSet = new Set(state.config.groupNames);
    const rows = items.map((sub) => {
      const sideTotal = (side) => {
        const total = criteria.reduce((sum, c) => {
          const score = Number(sub.scores?.[side]?.[c.name] || 0);
          return sum + normalizeScore(score, Number(c.max || 10), state.config.scoreScale) * (Number(c.weight || 0) / 100);
        }, 0);
        return state.config.scoreMapping ? normalizeScore(total, state.config.scoreScale, state.config.mappedScale) : total;
      };
      return {
        ...sub,
        roleType: judgeSet.has(sub.name) ? 'judge' : groupSet.has(sub.name) ? 'group' : sub.roleType,
        support: sideTotal('support'),
        oppose: sideTotal('oppose')
      };
    });
    const avg = (list, side) => list.length ? list.reduce((a, b) => a + b[side], 0) / list.length : 0;
    const judges = rows.filter((r) => r.roleType === 'judge');
    const groups = rows.filter((r) => r.roleType === 'group');
    return {
      rows,
      scale: state.config.scoreMapping ? state.config.mappedScale : state.config.scoreScale,
      support: avg(judges, 'support') * (state.config.judgeWeight / 100) + avg(groups, 'support') * (state.config.groupWeight / 100),
      oppose: avg(judges, 'oppose') * (state.config.judgeWeight / 100) + avg(groups, 'oppose') * (state.config.groupWeight / 100)
    };
  }, [state.scores, state.config]);

  const statsSummary = useMemo(() => {
    const items = Object.values(state.stats.submissions);
    let support = 0;
    let oppose = 0;
    const judgeOpinions = [];
    items.forEach((item) => {
      if (item.mode === 'group') {
        support += Number(item.supportCount || 0);
        oppose += Number(item.opposeCount || 0);
      } else {
        if (item.stance === 'support') support += 1;
        if (item.stance === 'oppose') oppose += 1;
        judgeOpinions.push(item);
      }
    });
    const total = support + oppose || 1;
    return { support, oppose, supportPct: (support / total) * 100, opposePct: (oppose / total) * 100, judgeOpinions };
  }, [state.stats]);

  return { state, setState, actions, scoreSummary, statsSummary };
}
