import React from 'react'
import { formatLatinNumber, normalizeImageUrl } from '../utils/ui'
import { cleanId, toNumber, formatMoney, same, clean } from '../utils/helpers'
import ActiveSeasonMembersPanel from '../components/members/ActiveSeasonMembersPanel'

function HomeIcon({ type = 'news', size = 14, className = '' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.35, strokeLinecap: 'round', strokeLinejoin: 'round', className: `hp2SvgIcon ${className}` };
  const icons = {
    members: [React.createElement('path', { key: 'a', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }), React.createElement('circle', { key: 'b', cx: 9, cy: 7, r: 4 }), React.createElement('path', { key: 'c', d: 'M22 21v-2a4 4 0 0 0-3-3.87' }), React.createElement('path', { key: 'd', d: 'M16 3.13a4 4 0 0 1 0 7.75' })],
    trophy: [React.createElement('path', { key: 'a', d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6' }), React.createElement('path', { key: 'b', d: 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18' }), React.createElement('path', { key: 'c', d: 'M4 22h16' }), React.createElement('path', { key: 'd', d: 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' }), React.createElement('path', { key: 'e', d: 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' }), React.createElement('path', { key: 'f', d: 'M18 2H6v7a6 6 0 0 0 12 0V2Z' })],
    medal: [React.createElement('path', { key: 'a', d: 'M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15' }), React.createElement('circle', { key: 'b', cx: 12, cy: 17, r: 5 }), React.createElement('path', { key: 'c', d: 'M12 14v6' }), React.createElement('path', { key: 'd', d: 'M9 17h6' })],
    news: [React.createElement('path', { key: 'a', d: 'M4 22h16a2 2 0 0 0 2-2V4H6v16a2 2 0 0 1-2 2Z' }), React.createElement('path', { key: 'b', d: 'M2 10v10a2 2 0 1 0 4 0V10H2Z' }), React.createElement('path', { key: 'c', d: 'M10 8h8' }), React.createElement('path', { key: 'd', d: 'M10 12h8' }), React.createElement('path', { key: 'e', d: 'M10 16h5' })],
    worldcup: [React.createElement('circle', { key: 'a', cx: 12, cy: 12, r: 10 }), React.createElement('path', { key: 'b', d: 'M2 12h20' }), React.createElement('path', { key: 'c', d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z' })],
    transfer: [React.createElement('path', { key: 'a', d: 'm17 2 4 4-4 4' }), React.createElement('path', { key: 'b', d: 'M3 11V9a4 4 0 0 1 4-4h14' }), React.createElement('path', { key: 'c', d: 'm7 22-4-4 4-4' }), React.createElement('path', { key: 'd', d: 'M21 13v2a4 4 0 0 1-4 4H3' })],
    live: [React.createElement('path', { key: 'a', d: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9' }), React.createElement('path', { key: 'b', d: 'M7.8 16.2a6 6 0 0 1 0-8.5' }), React.createElement('circle', { key: 'c', cx: 12, cy: 12, r: 2 }), React.createElement('path', { key: 'd', d: 'M16.2 7.8a6 6 0 0 1 0 8.5' }), React.createElement('path', { key: 'e', d: 'M19.1 4.9C23 8.8 23 15.2 19.1 19.1' })],
    history: [React.createElement('path', { key: 'a', d: 'M3 12a9 9 0 1 0 3-6.7' }), React.createElement('path', { key: 'b', d: 'M3 3v6h6' }), React.createElement('path', { key: 'c', d: 'M12 7v5l4 2' })],
    calendar: [React.createElement('path', { key: 'a', d: 'M8 2v4' }), React.createElement('path', { key: 'b', d: 'M16 2v4' }), React.createElement('rect', { key: 'c', x: 3, y: 4, width: 18, height: 18, rx: 3 }), React.createElement('path', { key: 'd', d: 'M3 10h18' })],
    announcement: [React.createElement('path', { key: 'a', d: 'M3 11v2a2 2 0 0 0 2 2h3l7 4V5L8 9H5a2 2 0 0 0-2 2Z' }), React.createElement('path', { key: 'b', d: 'M19 9a4 4 0 0 1 0 6' })],
    football: [React.createElement('circle', { key: 'a', cx: 12, cy: 12, r: 10 }), React.createElement('path', { key: 'b', d: 'm12 6 4 3-1.5 5h-5L8 9l4-3Z' }), React.createElement('path', { key: 'c', d: 'M8 9 4.5 8' }), React.createElement('path', { key: 'd', d: 'M16 9l3.5-1' }), React.createElement('path', { key: 'e', d: 'M9.5 14 7 18' }), React.createElement('path', { key: 'f', d: 'M14.5 14 17 18' })],
    stat: [React.createElement('circle', { key: 'a', cx: 12, cy: 12, r: 10 }), React.createElement('circle', { key: 'b', cx: 12, cy: 12, r: 3 })],
  };
  return React.createElement('svg', common, icons[type] || icons.news);
}

function HomePage({
  config,
  rankedMembers = [],
  members = [],
  allTournaments = [],
  competitions = [],
  financeRows = [],
  totalForMember,
  transferPeriods = [],
  goPage,
  setSelectedId,
  setFocusedCompetitionId,
  setArchiveDefaultMode,
  onOpenMember,
}) {
  const completedComps = React.useMemo(() => competitions.filter((c) =>
    c.status === 'completed' || c.status === 'finished' || c.status === 'done'
  ).sort((a, b) => {
    const da = new Date(b.endDate || b.date || 0).getTime()
    const db = new Date(a.endDate || a.date || 0).getTime()
    return da - db
  }).slice(0, 5), [competitions])

  const seasons = [
    { id: 'S1', label: 'الموسم الأول', years: '2017-2020', color: '#00D4FF' },
    { id: 'S2', label: 'الموسم الثاني', years: '2020-2021', color: '#A855F7' },
    { id: 'S3', label: 'الموسم الثالث', years: '2021-2023', color: '#FF6B35' },
    { id: 'S4', label: 'الموسم الرابع', years: '2023', color: '#E5B53A' },
    { id: 'S5', label: 'الموسم الخامس', years: '2024', color: '#F472B6' },
    { id: 'S6', label: 'الموسم السادس', years: '2025-الآن', color: '#00E676', active: true },
  ]

  const seasonAccent = (season) => season.active ? '#00E676' : (season.color || '#00D4FF')
  const seasonCardStyle = (season) => {
    const accent = seasonAccent(season)
    return {
      '--seasonAccent': accent,
      '--seasonAccentSoft': season.active ? 'rgba(0,230,118,.16)' : 'rgba(0,212,255,.105)',
      '--seasonAccentBorder': season.active ? 'rgba(0,230,118,.34)' : 'rgba(0,212,255,.22)',
      '--seasonAccentGlow': season.active ? 'rgba(0,230,118,.20)' : 'rgba(0,212,255,.11)',
    }
  }

  const activeComps = competitions.filter((c) => c.status === 'active' || c.status === 'inProgress' || c.status === 'ongoing')
  const s6Tourns = allTournaments.filter((t) => String(t.seasonId || t.season || '').includes('6') || String(t.seasonId || t.season || '').includes('2025'))
  const topSeasonMember = (rankedMembers || [])[0] || null
  const topSeasonMemberName = topSeasonMember?.name || topSeasonMember?.memberName || '-'
  const appIcon = config.appIcon ? normalizeImageUrl(config.appIcon) : ''

  const openMemberFromHome = React.useCallback((memberId) => {
    if (typeof onOpenMember === 'function') onOpenMember(memberId)
    else if (setSelectedId) {
      setSelectedId(memberId)
      goPage('members')
    }
  }, [onOpenMember, setSelectedId, goPage])

  const allTransfers = React.useMemo(() => {
    const rows = []
    ;(transferPeriods || []).forEach((period) => (period.rows || []).forEach((row) => rows.push(row)))
    return rows.slice().sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
  }, [transferPeriods])

  const newsItems = React.useMemo(() => {
    const items = []
    const now = Date.now()
    const today = new Date()
    const todayMD = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    const todayKey = today.getFullYear() + '-' + todayMD

    const compact = (value) => String(value || '').replace(/\s+/g, '').toLowerCase()
    const memberName = (memberId, fallback = '') => {
      const id = cleanId(memberId)
      const row = members.find((m) => same(m.id, id))
      return row?.name || fallback || id || ''
    }
    const dateValue = (value, fallback = 0) => {
      if (!value) return fallback
      if (typeof value?.toDate === 'function') return value.toDate().getTime()
      if (value?.seconds) return value.seconds * 1000
      const parsed = new Date(value).getTime()
      return Number.isFinite(parsed) ? parsed : fallback
    }
    const dateKey = (value) => {
      const ts = dateValue(value, 0)
      if (!ts) return ''
      const d = new Date(ts)
      if (isNaN(d.getTime())) return ''
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    }
    const monthDayKey = (value) => {
      const ts = dateValue(value, 0)
      if (!ts) return ''
      const d = new Date(ts)
      if (isNaN(d.getTime())) return ''
      return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    }
    const formatEdition = (value) => {
      const raw = String(value || '').trim()
      if (!raw) return ''
      return raw.startsWith('#') ? raw : 'النسخة ' + raw
    }
    const readableTrophyName = (row = {}) => {
      const name = row.name || row.trophyName || row.typeLabel || row.type || 'بطولة'
      const edition = formatEdition(row.edition || row.version || '')
      return edition ? name + ' ' + edition : name
    }
    const trophyTypeKey = (row = {}) => compact([row.name, row.trophyId, row.trophyName, row.type, row.typeLabel, row.competitionType].join(' '))
    const isWorldCup = (row = {}) => {
      const key = trophyTypeKey(row)
      return key.includes('كأسالعالم') || key.includes('كاسالعالم') || key.includes('worldcup') || key.includes('world_cup')
    }
    const isChampions = (row = {}) => {
      const key = trophyTypeKey(row)
      return key.includes('دوريالأبطال') || key.includes('دوريالابطال') || key.includes('champions')
    }
    const isLeague = (row = {}) => {
      const key = trophyTypeKey(row)
      return key.includes('الدوري') || key.includes('league')
    }
    const isCup = (row = {}) => {
      const key = trophyTypeKey(row)
      return (key.includes('الكأس') || key.includes('الكاس') || key.includes('cup')) && !isWorldCup(row)
    }
    const finalScoreText = (row = {}) => {
      const g1 = toNumber(row.finalPlayer1Goals ?? row.homeGoals ?? row.score1)
      const g2 = toNumber(row.finalPlayer2Goals ?? row.awayGoals ?? row.score2)
      if (String(row.finalResult || '').trim()) return String(row.finalResult).trim()
      if ((g1 || g2) && (row.finalPlayer1Id || row.finalPlayer2Id || row.homeMemberId || row.awayMemberId)) return g1 + '-' + g2
      return ''
    }
    const finalTotalGoals = (row = {}) => {
      const g1 = toNumber(row.finalPlayer1Goals ?? row.homeGoals ?? row.score1)
      const g2 = toNumber(row.finalPlayer2Goals ?? row.awayGoals ?? row.score2)
      return g1 + g2
    }
    const winnerIdOf = (row = {}) => cleanId(row.championMemberId || row.winnerId || row.championId || row.memberId || '')
    const winnerNameOf = (row = {}) => {
      const id = winnerIdOf(row)
      return row.championMemberName || row.winnerName || row.champion || row.championName || memberName(id)
    }
    const eventDateOf = (row = {}) => row.completedDate || row.endDate || row.date || row.createdAtText || row.createdAt || ''
    const trophyNamesList = (rows = []) => rows.map(readableTrophyName).filter(Boolean).slice(0, 3).join('، ')
    const pushNews = (item) => {
      if (!item?.title) return
      items.push({
        iconType: item.iconType || 'news',
        title: item.title,
        sub: item.sub || '',
        type: item.type || 'news',
        date: item.date || 'الآن',
        ts: Number.isFinite(item.ts) ? item.ts : now,
        nav: item.nav || null,
        priority: item.priority || 0,
      })
    }

    if (config.announcement) {
      pushNews({ iconType: 'announcement', title: config.announcement, sub: 'إعلان رسمي من FIFA GROUP', type: 'stat', date: 'الآن', ts: now + 9000000, priority: 125 })
    }

    activeComps.forEach((c, index) => {
      const createdTs = dateValue(c.createdAt || c.createdAtText || c.startDate || c.date, now - index)
      const typeText = c.typeLabel || c.type || 'بطولة'
      pushNews({
        iconType: 'live',
        title: 'المنافسة على الهواء: ' + (c.name || 'بطولة نشطة'),
        sub: typeText + ' ضمن ' + (c.seasonId || 'الموسم الحالي') + ' — النتائج والتفاصيل قيد التحديث.',
        type: 'competition',
        date: c.startDate || c.date || 'الآن',
        ts: createdTs + 8000000,
        priority: 100,
        nav: () => { if (setFocusedCompetitionId) setFocusedCompetitionId(c.id || ''); goPage('season') },
      })
    })

    const winEvents = []
    const eventSeen = new Set()
    const pushWinEvent = (row = {}, source = 'competition', index = 0) => {
      const winnerId = winnerIdOf(row)
      const winner = winnerNameOf(row)
      if (!winnerId && !winner) return
      const eventDate = eventDateOf(row)
      const key = [source, row.id || row.trophyId || row.name || row.trophyName || index, winnerId || winner, dateKey(eventDate)].join('|')
      if (eventSeen.has(key)) return
      eventSeen.add(key)
      winEvents.push({
        row,
        source,
        index,
        winnerId,
        winner,
        date: eventDate,
        dKey: dateKey(eventDate),
        ts: dateValue(eventDate, now - index),
      })
    }

    completedComps.forEach((c, index) => pushWinEvent(c, 'firebase', index))
    s6Tourns.filter((t) => cleanId(t.winnerId)).slice().sort((a, b) => dateValue(b.date, 0) - dateValue(a.date, 0)).slice(0, 12).forEach((t, index) => pushWinEvent(t, 'sheetS6', index))

    const groups = new Map()
    winEvents.forEach((event) => {
      const groupKey = (event.dKey || todayKey) + '|' + (event.winnerId || compact(event.winner))
      if (!groups.has(groupKey)) groups.set(groupKey, [])
      groups.get(groupKey).push(event)
    })

    Array.from(groups.values()).sort((a, b) => (b[0]?.ts || 0) - (a[0]?.ts || 0)).slice(0, 8).forEach((group, groupIndex) => {
      const sorted = group.slice().sort((a, b) => b.ts - a.ts)
      const main = sorted[0]
      const winner = main.winner
      const total = main.winnerId ? totalForMember(main.winnerId) : 0
      const date = main.date
      const trophies = trophyNamesList(sorted.map((item) => item.row))
      const hasWorld = sorted.some((item) => isWorldCup(item.row))
      const hasChampions = sorted.some((item) => isChampions(item.row))
      const hasBigFinal = sorted.some((item) => finalTotalGoals(item.row) >= 7)
      const score = finalScoreText(main.row)

      if (sorted.length >= 3) {
        pushNews({
          iconType: 'trophy',
          title: 'ليلة استثنائية لـ' + winner,
          sub: winner + ' يحصد ' + sorted.length + ' بطولات في يوم واحد' + (trophies ? ': ' + trophies : '') + (total ? ' — الرصيد الآن ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + ' بطولة.' : '.'),
          type: 'competition',
          date,
          ts: main.ts + 7600000 - groupIndex,
          priority: 112,
          nav: () => goPage('archive'),
        })
        return
      }

      if (sorted.length === 2) {
        pushNews({
          iconType: hasWorld ? 'worldcup' : 'trophy',
          title: 'ثنائية قوية لـ' + winner,
          sub: winner + ' يخرج من اليوم بلقبين' + (trophies ? ': ' + trophies : '') + (total ? ' — الرصيد ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + ' بطولة.' : '.'),
          type: hasWorld ? 'worldcup' : 'competition',
          date,
          ts: main.ts + 7300000 - groupIndex,
          priority: hasWorld ? 114 : 104,
          nav: () => goPage('archive'),
        })
        return
      }

      const row = main.row
      let title = winner + ' يضيف لقبًا جديدًا'
      let sub = readableTrophyName(row) + (total ? ' — الرصيد التاريخي الآن ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + ' بطولة.' : '.')
      let iconType = 'trophy'
      let type = 'competition'
      let priority = 86

      if (hasWorld) {
        title = 'على عرش العالم: ' + winner
        sub = winner + ' يتوج بكأس العالم' + (score ? ' بعد نهائي انتهى ' + score : '') + (total ? ' — الرصيد ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + ' بطولة.' : '.')
        iconType = 'worldcup'
        type = 'worldcup'
        priority = 111
      } else if (hasChampions) {
        title = 'سيد الأبطال: ' + winner
        sub = winner + ' يحسم دوري الأبطال ويضيف لقبًا مهمًا إلى سجله' + (total ? ' — الرصيد ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + '.' : '.')
        priority = 98
      } else if (isLeague(row)) {
        title = 'حسم جديد في الدوري'
        sub = winner + ' ينجح في خطف لقب الدوري' + (total ? ' ويرفع رصيده إلى ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + ' بطولة.' : '.')
        priority = 94
      } else if (isCup(row)) {
        title = 'طريق الكأس ينتهي بتتويج ' + winner
        sub = winner + ' يضيف كأسًا جديدًا إلى سجله' + (score ? ' بعد نهائي ' + score : '') + (total ? ' — الرصيد ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + '.' : '.')
        priority = 92
      }

      if (hasBigFinal) {
        title = 'نهائي لا يُنسى'
        sub = readableTrophyName(row) + ' ينتهي بنتيجة كبيرة ' + (score || '') + (winner ? ' ويتوج به ' + winner + '.' : '.')
        priority = Math.max(priority, 103)
      }

      pushNews({
        iconType,
        title,
        sub,
        type,
        date,
        ts: main.ts + 7000000 - groupIndex,
        priority,
        nav: () => { if (main.source === 'firebase' && setFocusedCompetitionId) setFocusedCompetitionId(row.id || ''); goPage(main.source === 'firebase' ? 'season' : 'archive') },
      })

      if (total && [50, 100, 150, 200, 250, 300, 350, 400, 500].includes(Math.round(total))) {
        pushNews({
          iconType: 'medal',
          title: 'رقم تاريخي جديد',
          sub: winner + ' يصل إلى حاجز ' + new Intl.NumberFormat('ar-SA').format(Math.round(total)) + ' بطولة في سجل FIFA GROUP.',
          type: 'stat',
          date,
          ts: main.ts + 6900000 - groupIndex,
          priority: 106,
          nav: () => goPage('archive'),
        })
      }
    })

    allTournaments.forEach((t, index) => {
      const md = monthDayKey(t.date)
      if (md !== todayMD) return
      const year = dateKey(t.date).slice(0, 4)
      const winner = winnerNameOf(t)
      const score = finalScoreText(t)
      const totalGoals = finalTotalGoals(t)
      const world = isWorldCup(t)
      const importantFinal = world || totalGoals >= 7 || score || cleanId(t.finalPlayer1Id) || cleanId(t.finalPlayer2Id)
      if (!importantFinal) return
      const name = readableTrophyName(t)
      const title = world
        ? 'في مثل هذا اليوم: ذكرى عالمية'
        : totalGoals >= 7
          ? 'في مثل هذا اليوم: نهائي تهديفي كبير'
          : 'في مثل هذا اليوم من سجل FIFA GROUP'
      const sub = [
        year ? 'عام ' + year : '',
        winner ? 'توج ' + winner + ' بـ' + name : name,
        score ? 'النتيجة ' + score : '',
      ].filter(Boolean).join(' — ')
      pushNews({
        iconType: world ? 'worldcup' : 'calendar',
        title,
        sub,
        type: world ? 'worldcup' : 'memory',
        date: t.date,
        ts: now + (world ? 3600000 : 2500000) - index,
        priority: world ? 108 : totalGoals >= 7 ? 91 : 72,
        nav: () => goPage('archive'),
      })
    })

    const seasonMilestones = [
      { date: '2017-10-01', title: 'في مثل هذا اليوم: انطلاق الموسم الأول', sub: 'بداية رحلة FIFA GROUP الرسمية.' },
      { date: '2020-06-25', title: 'في مثل هذا اليوم: انطلاق الموسم الثاني', sub: 'مرحلة جديدة من المنافسة التاريخية.' },
      { date: '2021-07-25', title: 'في مثل هذا اليوم: انطلاق الموسم الثالث', sub: 'واحد من أطول مواسم FIFA GROUP.' },
      { date: '2023-05-05', title: 'في مثل هذا اليوم: انطلاق الموسم الرابع', sub: 'عودة بطولات الموسم بنظام جديد.' },
      { date: '2024-11-22', title: 'في مثل هذا اليوم: انطلاق الموسم الخامس', sub: 'موسم قصير لكنه حاضر في السجل.' },
      { date: '2025-02-14', title: 'في مثل هذا اليوم: انطلاق الموسم السادس', sub: 'الموسم النشط الحالي.' },
    ]
    seasonMilestones.forEach((m) => {
      if (monthDayKey(m.date) === todayMD) pushNews({ iconType: 'calendar', title: m.title, sub: m.sub, type: 'memory', date: m.date, ts: now + 1800000, priority: 68, nav: () => goPage('archive') })
    })

    allTransfers.slice(0, 12).forEach((t, index) => {
      const player = t.player || t.playername || t.playerName || t.targetPlayerName || t.name || ''
      const from = t.from || t.frommember || t.fromMemberName || t.fromName || ''
      const to = t.to || t.tomember || t.toMemberName || t.toName || ''
      const amt = Math.max(0, toNumber(t.amount || t.price || t.value))
      const rawType = clean([t.type, t.contractType, t.dealType, t.note, t.notes].join(' '))
      const isLoan = rawType.includes('loan') || rawType.includes('اعار') || rawType.includes('إعار')
      const hasExchange = rawType.includes('exchange') || rawType.includes('swap') || rawType.includes('تبادل')
      const isHuge = amt >= 100000000
      const isLarge = amt >= 80000000 || isLoan || hasExchange
      if (!player || !isLarge) return
      pushNews({
        iconType: 'transfer',
        title: isHuge ? 'صفقة الموسم: ' + player : 'صفقة كبيرة: ' + player,
        sub: (to ? to + ' يضم اللاعب' : 'انتقال بارز') + (from ? ' من ' + from : '') + (amt ? ' مقابل ' + formatMoney(amt) : '') + (isLoan ? ' على سبيل الإعارة' : hasExchange ? ' ضمن صفقة تبادل' : ''),
        type: 'transfer',
        date: t.date || '',
        ts: dateValue(t.date, 0) + 1000000 - index,
        priority: isHuge ? 75 : 60,
        nav: () => goPage('transfers'),
      })
    })

    if (!items.length) pushNews({ iconType: 'football', title: 'FIFA GROUP — السجل الرسمي', sub: 'آخر الأخبار ستظهر هنا تلقائيًا.', type: 'stat', date: 'الآن', ts: now, priority: 1 })

    items.sort((a, b) => (b.priority - a.priority) || (b.ts - a.ts))
    const seen = new Set()
    return items.filter((item) => {
      const key = compact(item.title + '|' + item.sub)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 10)
  }, [allTransfers, allTournaments, s6Tourns, activeComps, completedComps, config.announcement, members, totalForMember, goPage, setFocusedCompetitionId])


  const tickerItems = React.useMemo(() => {
    const rows = newsItems.length ? newsItems : [{ title: 'FIFA GROUP — السجل الرسمي', iconType: 'football' }]
    return rows.slice(0, 8)
  }, [newsItems])

  const latestChampionCard = React.useMemo(() => {
    const memberName = (memberId, fallback = '') => {
      const id = cleanId(memberId)
      const row = members.find((member) => same(member.id, id))
      return row?.name || fallback || id || ''
    }
    const eventTime = (value) => {
      if (!value) return 0
      if (typeof value?.toDate === 'function') return value.toDate().getTime()
      if (value?.seconds) return value.seconds * 1000
      const parsed = new Date(value).getTime()
      return Number.isFinite(parsed) ? parsed : 0
    }
    const dateText = (value) => {
      const ts = eventTime(value)
      if (!ts) return ''
      const d = new Date(ts)
      return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
    }
    const completedRows = (competitions || [])
      .filter((item) => ['completed', 'finished', 'done'].includes(clean(item.status || '')))
      .map((item, index) => ({
        source: 'competition',
        order: index,
        id: item.id || '',
        trophyName: item.name || item.trophyName || item.typeLabel || competitionTypeLabel(item.type || 'league') || 'بطولة',
        championId: cleanId(item.championMemberId || item.winnerId || item.championId || ''),
        championName: item.championMemberName || item.champion || item.championName || '',
        date: item.completedDate || item.endDate || item.date || item.createdAtText || item.createdAt || '',
        ts: eventTime(item.completedDate || item.endDate || item.date || item.createdAtText || item.createdAt),
      }))
    const archiveRows = (s6Tourns || [])
      .filter((item) => cleanId(item.winnerId))
      .map((item, index) => ({
        source: 'archive',
        order: index + 10000,
        id: item.id || item.trophyId || '',
        trophyName: item.name || item.trophyName || item.typeLabel || item.type || 'بطولة',
        championId: cleanId(item.winnerId),
        championName: item.winnerName || '',
        date: item.date || '',
        ts: eventTime(item.date),
      }))
    const latest = [...completedRows, ...archiveRows].sort((a, b) => (b.ts - a.ts) || ((b.order || 0) - (a.order || 0)))[0]
    if (!latest) {
      return {
        title: 'آخر تتويج',
        main: 'بانتظار أول بطل',
        sub: 'سيظهر هنا آخر بطل بعد اعتماد بطولة مكتملة.',
        meta: '',
        iconType: 'trophy',
        showBadge: true,
        nav: () => goPage('season'),
      }
    }
    const champion = memberName(latest.championId, latest.championName) || latest.championName || 'بطل البطولة'
    return {
      title: 'آخر تتويج',
      main: champion + ' بطل ' + latest.trophyName,
      sub: 'آخر بطولة مكتملة في الموسم الحالي.',
      meta: dateText(latest.date),
      iconType: 'trophy',
      showBadge: true,
      nav: () => {
        if (latest.source === 'competition' && setFocusedCompetitionId) setFocusedCompetitionId(latest.id || '')
        goPage(latest.source === 'competition' ? 'season' : 'archive')
      },
    }
  }, [competitions, s6Tourns, members, goPage, setFocusedCompetitionId])

  const rankingPulseCard = React.useMemo(() => {
    const rows = (rankedMembers || []).slice(0, 3)
    const nameOf = (member) => member?.name || member?.memberName || member?.id || '-'
    const leader = rows[0]
    const second = rows[1]
    const third = rows[2]
    const podium = rows.map((member, index) => '#' + formatLatinNumber(index + 1) + ' ' + nameOf(member)).join(' · ')
    return {
      title: 'حركة التصنيف',
      main: leader ? nameOf(leader) + ' في الصدارة' : 'التصنيف بانتظار النتائج',
      sub: second ? 'أقرب الملاحقين: ' + nameOf(second) + (third ? '، ثم ' + nameOf(third) : '') : 'سيظهر ترتيب الأعضاء بعد توفر النتائج.',
      meta: podium,
      iconType: 'medal',
      showBadge: false,
      nav: () => goPage('ranking'),
    }
  }, [rankedMembers, goPage])

  const seasonCount = (sid) => {
    const map = { S1: ['1', '2017', '2018', '2019'], S2: ['2', '2020', '2021'], S3: ['3', '2021', '2022', '2023'], S4: ['4', '2023'], S5: ['5', '2024'], S6: ['6', '2025'] }
    const cnt = allTournaments.filter((t) => (map[sid] || []).some((k) => String(t.seasonId || t.season || '').includes(k))).length
    return cnt || { S1: 153, S2: 206, S3: 203, S4: 22, S5: 6, S6: '?' }[sid]
  }

  const css = `
.hp2{padding:0;animation:hp2In .28s ease both}
@keyframes hp2In{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.hp2SvgIcon{display:block}.hp2StatIcon{width:22px;height:22px;margin:0 auto 3px;border-radius:9px;display:grid;place-items:center;color:#00E676;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.18)}.hp2LabelIcon{color:#00E676;flex:0 0 auto}.hp2TickerIcon{color:#00E676;margin-inline-start:5px;opacity:.95}
.hp2Hero{border-radius:24px;padding:18px 16px 16px;position:relative;overflow:hidden;margin-bottom:0;background:linear-gradient(145deg,#040C1C,#081830 45%,#050D1E);border:1px solid rgba(0,230,118,.22)}
.hp2Hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 80% 5%,rgba(0,230,118,.14),transparent 50%),radial-gradient(ellipse at 10% 90%,rgba(0,212,255,.07),transparent 50%)}
.hp2Scan{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00E676,transparent);animation:hp2sc 3s ease-in-out infinite;opacity:.65;pointer-events:none}
@keyframes hp2sc{0%,100%{top:0;opacity:0}50%{top:100%;opacity:.8}}
.hp2HeroTop{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;position:relative;z-index:2}
.hp2HeroLogo{width:48px;height:48px;border-radius:14px;object-fit:contain;flex-shrink:0;box-shadow:0 0 20px rgba(0,230,118,.3)}
.hp2HeroLogoFb{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#00E676,#00B84C);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#020617;font-family:"Orbitron",sans-serif;flex-shrink:0;box-shadow:0 0 20px rgba(0,230,118,.3)}
.hp2HT{font-size:11px;font-weight:800;color:#00E676;letter-spacing:2px;margin-bottom:4px;display:flex;align-items:center;gap:6px}
.hp2HD{width:7px;height:7px;border-radius:50%;background:#00E676;animation:hp2dp 1.4s infinite;flex-shrink:0}
@keyframes hp2dp{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,230,118,.4)}50%{opacity:.5;box-shadow:0 0 0 5px transparent}}
.hp2HM{font-size:24px;font-weight:900;line-height:1.1;margin-bottom:12px;background:linear-gradient(135deg,#fff 40%,#00E676);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hp2HG{display:grid;grid-template-columns:repeat(3,1fr);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.05);position:relative;z-index:2}
.hp2HS{padding:10px 6px;text-align:center;background:rgba(0,0,0,.22);border-left:1px solid rgba(255,255,255,.05)}
.hp2HS:last-child{border-left:none}.hp2HS .v{font-size:18px;font-weight:900;color:#00E676}.hp2HS .l{font-size:9px;color:#6270A0;font-weight:700;margin-top:2px}
.hp2Ticker{height:36px;overflow:hidden;display:flex;align-items:center;background:linear-gradient(90deg,rgba(0,230,118,.08),rgba(0,212,255,.05),rgba(0,230,118,.08));border:1px solid rgba(0,230,118,.14);border-radius:14px;margin:10px 0 13px;position:relative;direction:ltr}.hp2Ticker::before,.hp2Ticker::after{content:"";position:absolute;top:0;bottom:0;width:30px;z-index:2;pointer-events:none}.hp2Ticker::before{right:0;background:linear-gradient(to right,transparent,#02030A)}.hp2Ticker::after{left:0;background:linear-gradient(to left,transparent,#02030A)}.hp2TT{display:inline-flex;width:max-content;min-width:max-content;white-space:nowrap;will-change:transform;direction:rtl;animation:fgTickerTrueLeftToRight 260s linear infinite!important}.hp2Ticker:hover .hp2TT{animation-play-state:paused}@keyframes fgTickerTrueLeftToRight{0%{transform:translateX(100vw)}100%{transform:translateX(calc(-100% - 40px))}}.hp2TI{font-size:11px;font-weight:700;color:#9BA0C0;padding:0 30px;flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;max-width:none;direction:rtl}.hp2TITitle{font-weight:900;color:#EDF0FF}.hp2TISub{font-weight:700;color:#9BA0C0}.hp2TISep{color:rgba(0,230,118,.45);font-weight:900}
.hp2HomePulseGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 14px}.hp2HomePulseCard{position:relative;overflow:hidden;border-radius:18px;padding:12px 12px 11px;background:linear-gradient(145deg,rgba(4,12,28,.88),rgba(6,15,34,.76));border:1px solid rgba(0,230,118,.14);box-shadow:0 12px 28px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.055);cursor:pointer;min-height:104px}.hp2HomePulseCard::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 88% 0%,rgba(0,230,118,.10),transparent 42%),linear-gradient(135deg,rgba(255,255,255,.04),transparent 58%);pointer-events:none}.hp2HomePulseTop{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.hp2HomePulseLabel{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:950;color:#00E676;letter-spacing:.3px}.hp2HomePulseBadge{font-size:8px;font-weight:900;color:#9BA0C0;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:999px;padding:2px 7px;white-space:nowrap}.hp2HomePulseMain{position:relative;z-index:1;font-size:13px;font-weight:950;color:#EDF0FF;line-height:1.35;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.hp2HomePulseSub{position:relative;z-index:1;font-size:10px;font-weight:750;color:#9BA0C0;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.hp2HomePulseMeta{position:relative;z-index:1;margin-top:8px;font-size:9px;font-weight:800;color:#6270A0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hp2HomePulseCard:active{transform:scale(.985)}@media(max-width:420px){.hp2HomePulseGrid{grid-template-columns:1fr 1fr;gap:8px}.hp2HomePulseCard{padding:11px 10px;min-height:112px}.hp2HomePulseMain{font-size:12px}.hp2HomePulseSub{font-size:9.5px}}
.hp2Lbl{font-size:10px;font-weight:800;color:#6270A0;letter-spacing:2px;text-transform:uppercase;margin:16px 0 10px;display:flex;align-items:center;gap:8px}.hp2Lbl::after{content:"";flex:1;height:1px;background:linear-gradient(to left,transparent,rgba(255,255,255,.07))}
.hp2CC{background:rgba(255,255,255,.032);border:1px solid rgba(0,230,118,.16);border-radius:20px;padding:13px;margin-bottom:9px;position:relative;overflow:hidden;cursor:pointer;transition:transform .18s;animation:hp2ci .3s ease both}@keyframes hp2ci{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.hp2CC:active{transform:scale(.98)}.hp2CC::before{content:"";position:absolute;top:0;right:0;width:80px;height:3px;background:linear-gradient(90deg,#00E676,#00D4FF)}.hp2CL{display:inline-flex;align-items:center;gap:5px;margin-bottom:7px;background:rgba(0,230,118,.10);border:1px solid rgba(0,230,118,.20);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:800;color:#00E676}.hp2LD{width:6px;height:6px;border-radius:50%;background:#00E676;animation:hp2dp 1.4s infinite;flex-shrink:0}.hp2CN{font-size:15px;font-weight:900;margin-bottom:2px}.hp2CM{font-size:11px;color:#9BA0C0}
.hp2SeasGrid{position:relative;display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:12px 8px 14px;margin-bottom:4px;border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.032),rgba(0,212,255,.026),rgba(0,0,0,.12));border:1px solid rgba(0,230,118,.12);scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none}.hp2SeasGrid::-webkit-scrollbar{display:none;width:0;height:0}.hp2TSeason{position:relative;z-index:2;flex:0 0 112px;min-height:96px;border-radius:18px;padding:8px 9px 9px;background:linear-gradient(160deg,rgba(4,12,28,.86),rgba(8,24,48,.52));border:1px solid var(--seasonAccentBorder);box-shadow:0 10px 26px rgba(0,0,0,.22),0 0 18px var(--seasonAccentGlow),inset 0 1px 0 rgba(255,255,255,.05);scroll-snap-align:start;cursor:pointer;overflow:hidden;transition:transform .18s,border-color .18s}.hp2TSeason:active{transform:scale(.97)}.hp2TSeason::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 6%,var(--seasonAccentSoft),transparent 38%),linear-gradient(135deg,rgba(255,255,255,.04),transparent 58%);pointer-events:none}.hp2TSeason.active{border-color:rgba(0,230,118,.42);box-shadow:0 0 26px rgba(0,230,118,.18),inset 0 1px 0 rgba(255,255,255,.06)}.hp2TSeasonRail{position:relative;z-index:2;height:17px;margin-bottom:5px;display:flex;align-items:center;justify-content:flex-start}.hp2TSeasonDot{width:13px;height:13px;border-radius:999px;background:var(--seasonAccent);box-shadow:0 0 0 4px rgba(255,255,255,.035),0 0 18px var(--seasonAccentGlow);border:2px solid rgba(2,6,23,.92)}.hp2TSeasonTop{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px}.hp2TSeasonID{font-size:10px;font-weight:950;letter-spacing:1px;color:var(--seasonAccent)}.hp2TSeasonAct{font-size:8px;font-weight:900;padding:2px 7px;border-radius:999px;color:#00E676;background:rgba(0,230,118,.13);border:1px solid rgba(0,230,118,.32)}.hp2TSeasonName{position:relative;z-index:2;font-size:12px;font-weight:900;color:#EDF0FF;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hp2TSeasonYears{position:relative;z-index:2;font-size:9px;color:#9BA0C0;margin-top:2px;direction:ltr;text-align:right}.hp2TSeasonStat{position:relative;z-index:2;margin-top:8px;display:flex;align-items:flex-end;justify-content:space-between;gap:5px}.hp2TSeasonCount{font-size:23px;font-weight:950;line-height:1;color:var(--seasonAccent);font-family:"Orbitron","Tajawal",sans-serif;text-shadow:0 0 16px var(--seasonAccentGlow)}.hp2TSeasonLabel{font-size:8px;font-weight:800;color:#9BA0C0;margin-bottom:2px}.hp2 .fgMemberLegacyPanel.active{padding-bottom:6px!important;margin-bottom:10px!important}.hp2 .fgMemberLegacyPanel.active .fgMemberLegacyRow{padding-bottom:0!important;margin-bottom:0!important}.hp2 .fgMemberLegacyPanel.active .fgMemberLegacyCard{margin-bottom:0!important}
.hp2NewsRow{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.07);border-radius:14px;margin-bottom:7px;position:relative;overflow:hidden}.hp2NewsRow.transfer{border-right:3px solid #00D4FF}.hp2NewsRow.final,.hp2NewsRow.memory,.hp2NewsRow.worldcup{border-right:3px solid #E5B53A}.hp2NewsRow.competition,.hp2NewsRow.news{border-right:3px solid #00E676}.hp2NewsRow.stat{border-right:3px solid #A855F7}.hp2NewsRowIcon{flex-shrink:0;width:32px;height:32px;border-radius:12px;display:grid;place-items:center;color:#00E676;background:linear-gradient(135deg,rgba(0,230,118,.14),rgba(0,212,255,.07));border:1px solid rgba(0,230,118,.22);box-shadow:0 0 16px rgba(0,230,118,.10)}.hp2NewsRow.worldcup .hp2NewsRowIcon,.hp2NewsRow.final .hp2NewsRowIcon,.hp2NewsRow.memory .hp2NewsRowIcon{color:#E5B53A;background:linear-gradient(135deg,rgba(229,181,58,.16),rgba(0,230,118,.06));border-color:rgba(229,181,58,.24)}.hp2NewsRow.transfer .hp2NewsRowIcon{color:#00D4FF;background:linear-gradient(135deg,rgba(0,212,255,.16),rgba(0,230,118,.06));border-color:rgba(0,212,255,.24)}.hp2NewsRowBody{flex:1;min-width:0}.hp2NewsRowTitle{font-size:12px;font-weight:850;color:#EDF0FF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}.hp2NewsRowSub{font-size:10.5px;color:#9BA0C0;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}.hp2NewsRowDate{font-size:9.5px;color:#6270A0;margin-top:2px;direction:ltr;text-align:right}
  `

  const fmtDate = (d) => {
    if (!d || d === 'الآن') return 'الآن'
    try {
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return d
      return dt.getFullYear() + '/' + (dt.getMonth() + 1) + '/' + dt.getDate()
    } catch { return d }
  }

  const renderNewsRows = (items) => items.slice(0, 10).map((n, i) =>
    React.createElement('div', { key: i, className: 'hp2NewsRow ' + n.type, onClick: n.nav || undefined, role: n.nav ? 'button' : undefined },
      React.createElement('div', { className: 'hp2NewsRowIcon', 'aria-hidden': 'true' }, React.createElement(HomeIcon, { type: n.iconType || 'news', size: 16 })),
      React.createElement('div', { className: 'hp2NewsRowBody' },
        React.createElement('div', { className: 'hp2NewsRowTitle' }, n.title),
        n.sub && React.createElement('div', { className: 'hp2NewsRowSub' }, n.sub),
        React.createElement('div', { className: 'hp2NewsRowDate' }, fmtDate(n.date))
      )
    )
  )

  return React.createElement('div', { className: 'widePage hp2' },
    React.createElement('style', null, css),
    React.createElement('div', { className: 'hp2Hero' },
      React.createElement('div', { className: 'hp2Scan' }),
      React.createElement('div', { className: 'hp2HeroTop' },
        React.createElement('div', null,
          React.createElement('div', { className: 'hp2HT' }, React.createElement('span', { className: 'hp2HD' }), (config.seasonName || 'الموسم السادس') + ' · ' + new Date().getFullYear()),
          React.createElement('div', { className: 'hp2HM' }, config.seasonTitle || 'الموسم السادس 2025')
        ),
        appIcon ? React.createElement('img', { className: 'hp2HeroLogo', src: appIcon, alt: 'FG' }) : React.createElement('div', { className: 'hp2HeroLogoFb' }, 'FG')
      ),
      React.createElement('div', { className: 'hp2HG' },
        [
          { v: rankedMembers.length, l: 'نشطون', icon: 'members' },
          { v: s6Tourns.length || '?', l: 'بطولة', icon: 'trophy' },
          { v: topSeasonMemberName, l: 'متصدر التصنيف', icon: 'medal' },
        ].map((s, i) => React.createElement('div', { key: i, className: 'hp2HS' }, React.createElement('span', { className: 'hp2StatIcon', 'aria-hidden': 'true' }, React.createElement(HomeIcon, { type: s.icon, size: 13 })), React.createElement('div', { className: 'v' }, s.v), React.createElement('div', { className: 'l' }, s.l)))
      )
    ),
    React.createElement('div', { className: 'hp2Ticker' },
      React.createElement('div', { className: 'hp2TT' }, tickerItems.map((item, i) => React.createElement('span', { key: i, className: 'hp2TI' }, React.createElement(HomeIcon, { type: item.iconType || 'news', size: 12, className: 'hp2TickerIcon' }), React.createElement('span', { className: 'hp2TITitle' }, item.title), item.sub ? React.createElement('span', { className: 'hp2TISub' }, ' — ' + item.sub) : null, ' ', React.createElement('span', { className: 'hp2TISep' }, String.fromCharCode(9670)), ' ')))
    ),
    React.createElement('div', { className: 'hp2HomePulseGrid' },
      [latestChampionCard, rankingPulseCard].map((card, index) =>
        React.createElement('div', { key: index, className: 'hp2HomePulseCard', role: 'button', onClick: card.nav },
          React.createElement('div', { className: 'hp2HomePulseTop' },
            React.createElement('div', { className: 'hp2HomePulseLabel' }, React.createElement(HomeIcon, { type: card.iconType || 'stat', size: 13, className: 'hp2LabelIcon' }), card.title),
            card.showBadge !== false && card.meta && React.createElement('span', { className: 'hp2HomePulseBadge' }, card.meta)
          ),
          React.createElement('div', { className: 'hp2HomePulseMain' }, card.main),
          React.createElement('div', { className: 'hp2HomePulseSub' }, card.sub),
          card.meta && React.createElement('div', { className: 'hp2HomePulseMeta' }, card.meta)
        )
      )
    ),
    rankedMembers.length > 0 && React.createElement(ActiveSeasonMembersPanel, {
      members: rankedMembers,
      financeRows,
      config,
      totalForMember,
      onOpenMember: openMemberFromHome,
      title: 'الأعضاء النشطون',
      subtitle: 'واجهة سريعة لفتح بروفايل أي عضو نشط بدون الدخول إلى تبويب الأعضاء القديم.',
    }),
    activeComps.length > 0 && React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'hp2Lbl' }, React.createElement(HomeIcon, { type: 'live', size: 14, className: 'hp2LabelIcon' }), 'بطولات نشطة الآن'),
      activeComps.slice(0, 3).map((c, i) => React.createElement('div', { key: i, className: 'hp2CC', onClick: () => { if (setFocusedCompetitionId) setFocusedCompetitionId(c.id || ''); goPage('season') } },
        React.createElement('div', { className: 'hp2CL' }, React.createElement('span', { className: 'hp2LD' }), 'مباشر'),
        React.createElement('div', { className: 'hp2CN' }, c.name || 'بطولة'),
        React.createElement('div', { className: 'hp2CM' }, (c.typeLabel || c.type || '') + ' · ' + (c.seasonId || 'S6'))
      ))
    ),
    React.createElement('div', { className: 'hp2Lbl' }, React.createElement(HomeIcon, { type: 'history', size: 14, className: 'hp2LabelIcon' }), 'المواسم التاريخية'),
    React.createElement('div', { className: 'hp2SeasGrid' }, seasons.map((s) => {
      const cnt = seasonCount(s.id)
      return React.createElement('div', { key: s.id, className: 'hp2TSeason' + (s.active ? ' active' : ''), style: seasonCardStyle(s), onClick: () => { if (setArchiveDefaultMode) setArchiveDefaultMode('season'); goPage('archive') } },
        React.createElement('div', { className: 'hp2TSeasonRail' }, React.createElement('span', { className: 'hp2TSeasonDot' })),
        React.createElement('div', { className: 'hp2TSeasonTop' },
          React.createElement('div', { className: 'hp2TSeasonID' }, s.id),
          s.active && React.createElement('div', { className: 'hp2TSeasonAct' }, 'نشط')
        ),
        React.createElement('div', { className: 'hp2TSeasonName' }, s.label),
        React.createElement('div', { className: 'hp2TSeasonYears' }, s.years),
        React.createElement('div', { className: 'hp2TSeasonStat' },
          React.createElement('div', { className: 'hp2TSeasonCount' }, cnt),
          React.createElement('div', { className: 'hp2TSeasonLabel' }, 'بطولة')
        )
      )
    })),
    newsItems.length > 0 && React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'hp2Lbl' }, React.createElement(HomeIcon, { type: 'news', size: 14, className: 'hp2LabelIcon' }), 'آخر الأخبار'),
      React.createElement('div', null, renderNewsRows(newsItems))
    ),
    React.createElement('div', { style: { height: 16 } })
  )
}

export default HomePage
