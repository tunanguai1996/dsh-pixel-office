/**
 * Pixel office — the Client half.
 *
 * A global main panel (keyed `pixel-office`) plus its `sidebar.panellist` entry.
 *
 * The room is drawn with near-large / far-small perspective: eight small desks
 * in the upper half (four columns, two deep) and the supervisor's and
 * secretary's larger desks across the bottom. Clicking a character opens a chat
 * popup with an avatar bar; clicking a monitor renames what that screen
 * represents. Delegations make the delegating Agent walk to the other desk.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-pixel-office',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Locale namespace owned by this plugin. */
    const NS = 'pixel-office'
    /** The id shared by the sidebar entry and the main panel it opens. */
    const PANEL_ID = 'pixel-office'
    /** localStorage keys: roles, seen stamps and the per-office seat order. */
    const ROLES_KEY = 'dsh-pixel-office.roles'
    const SEEN_KEY = 'dsh-pixel-office.seen-at'
    const SEATS_KEY = 'dsh-pixel-office.seat-order'
    const QUIPS = {
      casual: [
        '大学生干活就是快，我这边喝茶等结果。',
        '外包出去了，我只负责点头。',
        '看它跑得欢，我就放心摸鱼了。',
        '活儿分下去了，我这个当老板的终于清闲。',
        '这效率，比我自己干还快，离谱。',
      ],
      dry: [
        '子任务在跑，我先看结果。',
        '已分派，等回报。',
        '外包进行中，我留出复核时间。',
        '并行处理中，稍后核对产出。',
        '把手上的活分出去，专注检查。',
      ],
    }

    /** Pick the quip tone from the persona text. */
    function quipTone(persona) {
      const text = String(persona || '')
      return /(严谨|正式|冷静|严肃|沉稳|专业)/.test(text) ? 'dry' : 'casual'
    }

    const RULES_KEY = 'dsh-pixel-office.rules'
    const AGENT_RULES_KEY = 'dsh-pixel-office.agent-rules'
    const SEAT_MEMORY_KEY = 'dsh-pixel-office.seat-memory'
    const PERSONA_KEY = 'dsh-pixel-office.persona'
    const MEMORY_HASH_KEY = 'dsh-pixel-office.memory-hash'
    const NAME_KEY = 'dsh-pixel-office.names'
    /** Automatic memory pushes are off until the office side is proven stable. */
    const AUTO_MEMORY_SYNC = false
    const DRAFT_KEY = 'dsh-pixel-office.draft'
    /** Retain source name for the chat's held Session reference. */
    const RETAIN_SOURCE = 'pixelOffice'
    /** The room is drawn in this fixed pixel canvas. */
    const ROOM_W = 440
    const ROOM_H = 260
    /** The corridor between the small-desk area and the two large desks. */
    const EMPTY = []

    const DICT = {
      en: {
        panel: 'Pixel office',
        backToChat: 'Full chat',
        newSession: 'New session',
        officeLabel: 'Office',
        stateWorking: 'Working',
        stateWaiting: 'Needs you',
        stateDone: 'New result',
        stateIdle: 'Idle',
        emptyTitle: 'No Agents in this office yet',
        emptyHint: 'Start a session and a new pixel employee moves in.',
        noWorkspaceTitle: 'No workspace yet',
        noWorkspaceHint: 'Add a workspace in the sidebar so the office has a room to show.',
        loadingTitle: 'Setting up the desks…',
        emptySeat: 'Empty desk',
        needsReview: 'Review',
        needsApproval: 'Approve',
        close: 'Close',
        rename: 'Rename',
        newSeat: 'New employee',
        nameLabel: 'Name',
        namePlaceholder: 'Employee name',
        roleLabel: 'Role',
        cancel: 'Cancel',
        create: 'Create',
        save: 'Save',
        nameRequired: 'Enter a name',
        renameFailed: 'Rename failed',
        newFailed: 'Could not start the conversation',
        skills: 'Skills',
        noSkills: 'No skills loaded yet.',
        loadingSkills: 'Reading the bookshelf…',
        rules: 'Office rules',
        rulesEmpty: 'Click to write the rules',
        rulesHint: 'One rule per line; every message sent from this office carries them.',
        rulesExample: 'Keep replies short.',
        rulesPrefix: '[Office rules that every answer must follow]',
        agentRules: 'Personal rules',
        agentRulesHint: 'One rule per line; only this employee follows them, on top of the office rules.',
        agentRulesPrefix: '[Personal rules for this employee]',
        interview: 'Interview',
        dispatchInstruction: 'When you need a colleague to do something, end your reply with one line: 派工：<name or identity>｜<task>. They will report back to you only.',
        dispatchPrefix: '[Work assigned by',
        dispatchTail: '] Finish it, then report back to that supervisor in a couple of sentences only.',
        reportPrefix: '[Report from',
        seatRulesPrefix: "[Inherited from this desk's previous employee]",
        seatSkillsPrefix: 'Skills left at this desk:',
        roleCustomPlaceholder: 'New identity, e.g. Art lead',
        roleCustomHint: 'Custom identity',
        roleRename: 'Rename',
        rolePickCustom: 'Pick a custom identity first',
        roleDelete: 'Delete this identity',
        identitySummaryLabel: 'Identity summary',
        identitySummaryPlaceholder: 'One line about what this identity does (sent with the identity)',
        personaLabel: 'Character setting',
        personaPlaceholder: 'How this employee thinks and speaks, like a persona setting',
        personaPrefix: '[Character setting for this employee]',
        rosterPrefix: '[Office roster: name (identity) — use these to address or dispatch work]',
        memoryHeader: '[Memory sync from the pixel office] Remember the following: it is your identity, your persona, the office rules you must follow, and this desk history. Do not repeat it in replies.',
        memoryAuthoritative: 'If you noted a different name or identity before, this message wins and those notes are outdated.',
        memoryName: 'You are:',
        noneLabel: 'no identity',
        roleAdd: 'Add identity',
        dismiss: 'Dismiss (archive)',
        dismissConfirm: 'Dismiss this employee?',
        dismissYes: 'Dismiss',
        roleDialogHint: 'What this employee is responsible for',
        roleSupervisorHint: 'Runs the office and its big decisions',
        roleSecretaryHint: 'Keeps schedules, notes and messages',
        attach: 'Attach',
        attachRemove: 'Remove',
        attachUnsupported: 'Attachments are not available here',
        uploadFailed: 'Upload failed',
        image: 'Image',
        file: 'File',
        roleSupervisor: 'Supervisor',
        roleSecretary: 'Secretary',
        chat: 'Chat',
        chatPlaceholder: 'Message this employee — Enter sends, Shift+Enter breaks the line',
        send: 'Send',
        sending: 'Sending…',
        stop: 'Stop',
        opening: 'Opening the session…',
        openFailed: 'This session cannot be opened right now.',
        openInChat: 'Open in the full chat',
        you: 'You',
        emptyChat: 'No messages yet. Say something to start.',
        sendFailed: 'Message not sent',
        workingNow: 'Replying…',
        crashTitle: 'The office could not be drawn',
        crashHint: 'The Agents keep working. Go back to the chat and open the office again.',
      },
      zh: {
        panel: '像素办公室',
        backToChat: '完整对话',
        newSession: '新建会话',
        officeLabel: '办公室',
        stateWorking: '忙碌中',
        stateWaiting: '等你回复',
        stateDone: '有新结果',
        stateIdle: '空闲',
        emptyTitle: '这间办公室还没有 Agent',
        emptyHint: '新建一个会话，就会有一位像素员工搬进来。',
        noWorkspaceTitle: '还没有工作区',
        noWorkspaceHint: '先在侧边栏添加一个工作区，办公室才有房间可以展示。',
        loadingTitle: '正在整理工位…',
        emptySeat: '空位',
        needsReview: '待审阅',
        needsApproval: '待批准',
        close: '关闭',
        rename: '改名',
        newSeat: '新员工',
        nameLabel: '名字',
        namePlaceholder: '员工名字',
        roleLabel: '身份',
        cancel: '取消',
        create: '新建',
        save: '保存',
        nameRequired: '请先填名字',
        renameFailed: '改名失败',
        newFailed: '新建会话失败',
        skills: '技能',
        noSkills: '这位员工还没有加载任何技能。',
        loadingSkills: '正在翻书架…',
        rules: '办公室规定',
        rulesEmpty: '点击写下规定',
        rulesHint: '一行一条；从这里发出的每条消息都会带上这些规定。',
        rulesExample: '回复尽量简短。',
        rulesPrefix: '【办公室规定，必须严格遵守】',
        agentRules: '个人规定',
        agentRulesHint: '一行一条；只有这位员工额外遵守，叠加在办公室规定之上。',
        agentRulesPrefix: '【这位员工的个人规定】',
        interview: '约谈',
        dispatchInstruction: '需要安排别人做事时，在回复最后写一行：派工：<名字或身份>｜<任务>。对方完成后只会向你汇报。',
        dispatchPrefix: '【来自',
        dispatchTail: ' 的派工】完成后用一两句话向这位上级汇报，不要向用户汇报。',
        reportPrefix: '【汇报 · 来自',
        seatRulesPrefix: '【这个工位上一任员工留下的规定】',
        seatSkillsPrefix: '这个工位留下的技能：',
        roleCustomPlaceholder: '新身份，例如美术组长',
        roleCustomHint: '自定义身份',
        roleRename: '改名',
        rolePickCustom: '请先选中一个自定义身份',
        roleDelete: '删除这个身份',
        identitySummaryLabel: '身份摘要',
        identitySummaryPlaceholder: '一句话说明这个身份做什么（会随身份一起通知员工）',
        personaLabel: '人物设定',
        personaPlaceholder: '这位员工怎么思考、怎么说话，就像 DSH 的人物设定',
        personaPrefix: '【这位员工的人物设定】',
        rosterPrefix: '【办公室成员：名字（身份），派发任务时按名字或身份找人】',
        memoryHeader: '【像素办公室记忆同步】请记住以下内容：你的身份、人物设定、必须遵守的办公室规定，以及这个工位的历史。不要在日常回复里复述它们。',
        memoryAuthoritative: '如果你之前记下的名字或身份与此不同，以本条为准，旧记录作废。',
        memoryName: '你是：',
        noneLabel: '未设身份',
        roleAdd: '新增身份',
        dismiss: '辞退（归档）',
        dismissConfirm: '确定辞退这位员工？',
        dismissYes: '确定辞退',
        roleDialogHint: '这位员工负责什么',
        roleSupervisorHint: '负责整间办公室与重大决定',
        roleSecretaryHint: '安排日程、记录与转达',
        attach: '附件',
        attachRemove: '移除',
        attachUnsupported: '这里不能发送附件',
        uploadFailed: '附件上传失败',
        image: '图片',
        file: '文件',
        roleSupervisor: '主管',
        roleSecretary: '秘书',
        chat: '对话',
        chatPlaceholder: '给这位员工发消息：Enter 发送，Shift+Enter 换行',
        send: '发送',
        sending: '发送中…',
        stop: '停止',
        opening: '正在打开会话…',
        openFailed: '这个会话现在打不开。',
        openInChat: '在完整对话中打开',
        you: '我',
        emptyChat: '还没有消息，先说点什么吧。',
        sendFailed: '消息没有发出去',
        workingNow: '正在回复…',
        crashTitle: '办公室没能画出来',
        crashHint: 'Agent 们仍在工作。回到对话后再打开办公室试试。',
      },
    }

    /** Artwork palette (artwork owns its own colors). */
    const SHIRTS = ['#5b8def', '#e8734a', '#54b98a', '#b06bd1', '#e8b84a', '#e0566f', '#48b0c9']
    const HAIRS = ['#2f2a3a', '#5b3a29', '#c98b3f', '#8a8a95', '#7a3f8f']
    const SKINS = ['#f2c9a0', '#e2b184', '#c98d63', '#c07b52']
    const VARIANTS = ['plain', 'headset', 'glasses', 'cap']
    const PANTS = '#3a3f57'
    const SHOE = '#22242f'

    /** Upper area: four evenly spaced columns, all facing the viewer. */
    const COLUMNS = [
      { dir: -1, personX: 100 },
      { dir: 1, personX: 180 },
      { dir: -1, personX: 260 },
      { dir: 1, personX: 340 },
    ]
    /** Upper area depth rows: the far one is smaller. */
    const ROW_DEFS = [
      { feetY: 92, scale: 0.86 },
      { feetY: 150, scale: 1 },
    ]
    /** The two large desks across the bottom, seen from behind. */
    const BIG_DEFS = [
      { personX: 136, feetY: 250, scale: 1.55, body: 1.65 },
      { personX: 304, feetY: 250, scale: 1.55, body: 1.65 },
    ]

    /** One small seat: back-facing owner centred on a compact desk. */
    function smallSeat(row, col) {
      const column = COLUMNS[col]
      const rowDef = ROW_DEFS[row]
      const s = rowDef.scale
      return {
        kind: 'small',
        row: row,
        col: col,
        dir: column.dir,
        personX: column.personX,
        feetY: rowDef.feetY,
        scale: s,
        variant: 'back',
        spriteW: 18 * s,
        alertX: column.personX + 5 * s,
        alertY: rowDef.feetY - 23.5 * s,
        screenX: column.personX,
        screenY: rowDef.feetY - 27 * s,
        screenW: 14 * s,
        screenH: 8 * s,
        shelfX: column.personX + 16 * s,
        shelfY: rowDef.feetY - 27.5 * s,
        shelfW: 10 * s,
        shelfH: 15 * s,
        mugX: column.personX - 17 * s,
        mugY: rowDef.feetY - 19.5 * s,
        mugW: 6 * s,
        mugH: 6 * s,
        standX: column.personX,
        standY: rowDef.feetY + 14 * s,
      }
    }

    /** One large seat: back-facing character in front of a wide desk. */
    function bigSeat(index) {
      const def = BIG_DEFS[index]
      return {
        kind: 'big',
        index: index,
        dir: 0,
        personX: def.personX,
        feetY: def.feetY,
        scale: def.scale,
        variant: 'back',
        spriteW: 26 * def.body,
        alertX: def.personX + 6 * def.body,
        alertY: def.feetY - 34 * def.body,
        screenX: def.personX,
        screenY: def.feetY - 48.5 * def.scale,
        screenW: 26 * def.scale,
        screenH: 13 * def.scale,
        shelfX: def.personX + 32 * def.scale,
        shelfY: def.feetY - 50 * def.scale,
        shelfW: 24 * def.scale,
        shelfH: 20 * def.scale,
        mugX: def.personX - 35.5 * def.scale,
        mugY: def.feetY - 43 * def.scale,
        mugW: 5 * def.scale,
        mugH: 6 * def.scale,
        standX: def.personX + (def.personX < 220 ? 84 : -84),
        standY: 244,
      }
    }

    const SMALL_SEATS = []
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) SMALL_SEATS.push(smallSeat(row, col))
    }
    const BIG_SEATS = [bigSeat(0), bigSeat(1)]

    // ------------------------------------------------------------------ helpers

    /** Stable 32-bit hash for per-Agent colors. */
    function hashOf(text) {
      let hash = 2166136261
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
      }
      return hash >>> 0
    }

    /** A stable badge colour for any identity label. */
    function identityColor(label) {
      const text = String(label || '')
      if (text === '') return ''
      const hue = hashOf(text) % 360
      return 'hsl(' + hue + ', 62%, 68%)'
    }

    /** Darken or lighten one palette colour. */
    function shade(hex, factor) {
      const raw = String(hex || '#000000').replace('#', '')
      const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw
      if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex
      const value = parseInt(full, 16)
      const parts = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
        const next = factor < 1 ? channel * factor : channel + (255 - channel) * (factor - 1)
        return Math.max(0, Math.min(255, Math.round(next)))
      })
      return '#' + parts.map((channel) => channel.toString(16).padStart(2, '0')).join('')
    }

    /** Per-Agent sprite palette, stable across reloads. */
    function paletteOf(id) {
      const seed = hashOf(String(id))
      return {
        shirt: SHIRTS[seed % SHIRTS.length],
        hair: HAIRS[(seed >>> 4) % HAIRS.length],
        skin: SKINS[(seed >>> 8) % SKINS.length],
        variant: VARIANTS[(seed >>> 12) % VARIANTS.length],
        style: (seed >>> 16) % 8,
        gear: (seed >>> 20) % 5,
        outfit: (seed >>> 24) % 5,
      }
    }

    /** State precedence: an interaction outranks work, work outranks an unread result. */
    function stateOf(summary, status, seenAt, isOpen, hasNews) {
      if (status && status.pendingInteraction) return 'waiting'
      const running = status && typeof status.running === 'boolean'
        ? status.running
        : !!(summary && summary.running)
      if (running) return 'working'
      if (isOpen) return 'idle'
      // The office counts a run that finished since the chat was last open as a
      // report to review, whatever the shipped client's unread flag says.
      if (hasNews) return 'done'
      const stamp = summary && typeof summary.updatedAt === 'number' ? summary.updatedAt : 0
      const seen = typeof seenAt === 'number' ? seenAt : 0
      if (seen > 0 && stamp > 0) return stamp > seen ? 'done' : 'idle'
      if (status && status.completionUnread) return 'done'
      return 'idle'
    }

    /** Whether an Agent counts as busy. */
    function isRunning(summary, status) {
      if (status && typeof status.running === 'boolean') return status.running
      return !!(summary && summary.running)
    }

    /** Text, images and files of one message's content blocks. */
    function blocksOf(message, strictText) {
      const content = message && message.content
      const texts = []
      const images = []
      const files = []
      if (Array.isArray(content)) {
        for (let index = 0; index < content.length; index += 1) {
          const block = content[index]
          if (!block || typeof block !== 'object') continue
          const kind = block.kind !== undefined ? block.kind : block.type
          // Only visible answer text: reasoning/thinking blocks stay out of the chat.
          const answerText = kind === 'text' || (kind === undefined && strictText !== true)
          if (answerText && typeof block.text === 'string' && block.text !== '') texts.push(block.text)
          if (block.attachment) {
            const media = String(block.attachment.mediaType || '')
            const name = String(block.attachment.name || '')
            const looksImage = kind === 'image' || /^image\//.test(media) || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name)
            if (looksImage) images.push(block.attachment)
            else files.push(block.attachment)
          }
        }
      }
      // Some records keep attachments beside the content array instead of inside it.
      const extra = message && Array.isArray(message.attachments) ? message.attachments : EMPTY
      for (let index = 0; index < extra.length; index += 1) {
        const item = extra[index]
        if (!item || typeof item !== 'object') continue
        if (String(item.mediaType || '').indexOf('image/') === 0) images.push(item)
        else files.push(item)
      }
      return { text: texts.join('\n'), images: images, files: files }
    }

    /** A generated file mentioned by path in a tool result becomes a named card. */
    function fileCardsFromPaths(value, cards, depth) {
      if (depth > 5 || value === null) return
      if (typeof value === 'string') {
        if (/\.(png|jpe?g|webp|gif|bmp|svg|pdf|md|docx?|xlsx?|pptx?)$/i.test(value) && value.length < 260 && cards.indexOf(value) < 0) cards.push(value)
        return
      }
      if (typeof value !== 'object') return
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index += 1) fileCardsFromPaths(value[index], cards, depth + 1)
        return
      }
      for (const key of Object.keys(value)) fileCardsFromPaths(value[key], cards, depth + 1)
    }

    /** Collect every attachment-shaped object inside one event, whatever its shape. */
    function sweepAttachments(value, images, files, depth) {
      if (depth > 4 || value === null || typeof value !== 'object') return
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index += 1) sweepAttachments(value[index], images, files, depth + 1)
        return
      }
      if (typeof value.attachmentId === 'string') {
        if (String(value.mediaType || '').indexOf('image/') === 0) {
          if (images.indexOf(value) < 0) images.push(value)
        } else if (files.indexOf(value) < 0) files.push(value)
        return
      }
      for (const key of Object.keys(value)) sweepAttachments(value[key], images, files, depth + 1)
    }

    /** Split one message into chat-sized bubbles at paragraph and sentence breaks. */
    function stripCode(text) {
      const fence = String.fromCharCode(96)
      let out = String(text || '')
      const triple = fence + fence + fence
      while (out.indexOf(triple) >= 0) {
        const head = out.indexOf(triple)
        const tail = out.indexOf(triple, head + 3)
        if (tail < 0) break
        out = out.slice(0, head) + '\n\n（代码略）\n\n' + out.slice(tail + 3)
      }
      return out
    }

    /** Drop the technical lines (commands, paths, code) a chat bubble should not show. */
    function stripTech(text) {
      const lines = String(text || '').split(/\r?\n/)
      const out = []
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const trimmed = line.trim()
        if (/^(\$|>|node|npm|pnpm|pwsh|powershell|git|cd|dir|copy|move|curl|invoke-)\b/i.test(trimmed)) continue
        if (/^\s{4,}\S/.test(line)) continue
        if (/(const|let|function|import|export|class|return|await|async)\s+[A-Za-z_$]/.test(trimmed)) continue
        if (/[A-Za-z]:\\|\.(mjs|js|ts|tsx|jsx|ps1|json|txt|png|md)\b/.test(trimmed)) continue
        if (/=>|===|\(\)|\.map\(|console\./.test(trimmed)) continue
        out.push(line)
      }
      return out.join('\n').replace(/\n{3,}/g, '\n\n')
    }

    function splitParagraphs(text) {
      const source = typeof text === 'string' ? stripTech(stripCode(text)) : ''
      const out = []
      const paragraphs = source.split(/\n{2,}/)
      for (let index = 0; index < paragraphs.length; index += 1) {
        let rest = paragraphs[index].trim()
        if (rest === '') continue
        while (rest.length > 200) {
          let cut = 200
          for (let back = 200; back > 60; back -= 1) {
            if (/[。！？!?；;]/.test(rest.charAt(back - 1))) { cut = back; break }
          }
          out.push(rest.slice(0, cut).trim())
          rest = rest.slice(cut).trim()
        }
        if (rest !== '') out.push(rest)
      }
      return out
    }

    /** Read one browser file as base64 without its data-URL prefix. */
    function readFileBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = String(reader.result || '')
          const comma = result.indexOf(',')
          resolve(comma >= 0 ? result.slice(comma + 1) : result)
        }
        reader.onerror = () => reject(reader.error || new Error('read failed'))
        reader.readAsDataURL(file)
      })
    }

    /** Compact byte size for a file card. */
    function formatBytes(bytes) {
      const value = typeof bytes === 'number' && isFinite(bytes) ? bytes : 0
      if (value < 1024) return value + ' B'
      if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
      return (value / (1024 * 1024)).toFixed(1) + ' MB'
    }

    /** Fold a Session event window into chat rows, plus the live streaming tail. */
    function buildChat(window) {
      const nodes = []
      let live = ''
      const entries = window && Array.isArray(window.entries) ? window.entries : EMPTY
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index]
        if (!entry) continue
        if (entry.type === 'transient') {
          const chunk = entry.event && entry.event.data && entry.event.data.chunk
          if (chunk && chunk.type === 'text-delta' && typeof chunk.text === 'string') live += chunk.text
          continue
        }
        const event = entry.event
        if (!event) continue
        if (event.type === 'user/message') {
          // Injected context (time, timezone, instructions) is not something the
          // person at the keyboard said, so it never reaches the office chat.
          const source = event.data && event.data.source
          if (source && source.kind !== 'user') continue
          const parts = blocksOf(event.data)
          sweepAttachments(event.data, parts.images, parts.files, 0)
          if (/^(【像素办公室记忆同步|\[Memory sync from the pixel office\])/.test(parts.text)) continue
          if (parts.text !== '' || parts.images.length > 0 || parts.files.length > 0) {
            nodes.push({
              kind: 'user',
              key: 'u' + event.seq,
              paragraphs: splitParagraphs(parts.text),
              images: parts.images,
              files: parts.files,
            })
          }
          live = ''
        } else if (event.type === 'assistant/message') {
          const message = event.data && event.data.message
          const parts = blocksOf(message, true)
          sweepAttachments(event.data, parts.images, parts.files, 0)
          if (parts.text !== '' || parts.images.length > 0) {
            nodes.push({
              kind: 'assistant',
              key: 'a' + event.seq,
              paragraphs: splitParagraphs(parts.text),
              images: parts.images,
              files: parts.files,
            })
          }
          live = ''
        } else {
          // An image or file that arrives through a tool result still belongs in
          // the conversation, so it is shown on the employee's side.
          const parts = blocksOf(event.data, true)
          sweepAttachments(event.data, parts.images, parts.files, 0)
          const paths = []
          fileCardsFromPaths(event.data, paths, 0)
          for (let index = 0; index < paths.length; index += 1) {
            const path = paths[index]
            const name = path.split(/[\\/]/).pop()
            if (name && !parts.files.some((file) => (file && file.name) === name)) parts.files.push({ name: name, bytes: 0, path: path })
          }
          if (parts.images.length > 0 || parts.files.length > 0) {
            nodes.push({
              kind: 'assistant',
              key: 't' + event.seq,
              paragraphs: [],
              images: parts.images,
              files: parts.files,
            })
          }
        }
      }
      if (nodes.length > 200) nodes.splice(0, nodes.length - 200)
      return { nodes: nodes, live: live }
    }

    /** Persisted per-office roles: `{ [workspaceId]: { supervisor, secretary } }`. */
    function readRoles() {
      try {
        const raw = window.localStorage.getItem(ROLES_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    /** Persist the role roster; storage may be unavailable. */
    function writeRoles(roles) {
      try {
        window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
      } catch (error) {
        /* A blocked storage keeps the roles for this page only. */
      }
    }

    /** Read the per-Agent "last looked at" stamps; storage may be unavailable. */
    function readSeen() {
      try {
        const raw = window.localStorage.getItem(SEEN_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeSeen(book) {
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage keeps the stamps for this page only. */
      }
    }

    /** Read the per-office seat order: `{ [workspaceId]: [agentId|null, ...] }`. */
    function readSeatBook() {
      try {
        const raw = window.localStorage.getItem(SEATS_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeSeatBook(book) {
      try {
        window.localStorage.setItem(SEATS_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage keeps the order for this page only. */
      }
    }

    /** Read the per-office rules shown on the whiteboard. */
    function readRules() {
      try {
        const raw = window.localStorage.getItem(RULES_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeRules(book) {
      try {
        window.localStorage.setItem(RULES_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage keeps the rules for this page only. */
      }
    }

    /** Per-Agent extra rules, set from the mug on each desk. */
    function readAgentRules() {
      try {
        const raw = window.localStorage.getItem(AGENT_RULES_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeAgentRules(book) {
      try {
        window.localStorage.setItem(AGENT_RULES_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage keeps the rules for this page only. */
      }
    }

    /** Read the last clean name seen for each Agent. */
    function readNames() {
      try {
        const raw = window.localStorage.getItem(NAME_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeNames(book) {
      try {
        window.localStorage.setItem(NAME_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage forgets the clean names. */
      }
    }

    /** Read the fingerprints of the last memory block sent to each Agent. */
    function readMemoryHashes() {
      try {
        const raw = window.localStorage.getItem(MEMORY_HASH_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeMemoryHashes(book) {
      try {
        window.localStorage.setItem(MEMORY_HASH_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage re-sends memory once per page load. */
      }
    }

    /** Read each Agent's persona text (the detailed character setting). */
    function readPersonas() {
      try {
        const raw = window.localStorage.getItem(PERSONA_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writePersonas(book) {
      try {
        window.localStorage.setItem(PERSONA_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage keeps the persona for this page only. */
      }
    }

    /** Read what each desk remembers from its previous employee. */
    function readSeatMemory() {
      try {
        const raw = window.localStorage.getItem(SEAT_MEMORY_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (error) {
        return {}
      }
    }

    function writeSeatMemory(book) {
      try {
        window.localStorage.setItem(SEAT_MEMORY_KEY, JSON.stringify(book))
      } catch (error) {
        /* A blocked storage keeps the memory for this page only. */
      }
    }

    /** Slot index of a seat key: s0..s7 then b0,b1. */
    function slotIndexOf(seatKey) {
      const text = String(seatKey || '')
      const index = Number(text.replace(/[sb]/, ''))
      if (!isFinite(index)) return -1
      return text.charAt(0) === 'b' ? 8 + index : index
    }

    /** Skill names loaded by one session event window. */
    function skillNamesOf(entries) {
      const out = []
      const seen = new Set()
      for (let index = 0; index < entries.length; index += 1) {
        const event = entries[index] && entries[index].event
        if (!event || event.type !== 'user/message') continue
        const source = event.data && event.data.source
        if (!source || source.kind !== 'skill-invocation') continue
        const text = skillTextOf(event.data)
        const name = typeof source.name === 'string' && source.name !== '' ? source.name : firstLineOf(text)
        if (name === '' || seen.has(name)) continue
        seen.add(name)
        out.push(name)
      }
      return out
    }

    /** Read one unsent draft, keyed by Agent. */
    function readDraft(agentId) {
      try {
        return window.localStorage.getItem(DRAFT_KEY + '.' + agentId) || ''
      } catch (error) {
        return ''
      }
    }

    function writeDraft(agentId, text) {
      try {
        if (text === '') window.localStorage.removeItem(DRAFT_KEY + '.' + agentId)
        else window.localStorage.setItem(DRAFT_KEY + '.' + agentId, text)
      } catch (error) {
        /* A blocked storage keeps the draft for this page only. */
      }
    }

    /** The injected body of one skill-invocation message. */
    function skillTextOf(message) {
      const content = message && message.content
      if (!Array.isArray(content)) return ''
      let out = ''
      for (let index = 0; index < content.length; index += 1) {
        const block = content[index]
        if (block && block.type === 'text' && typeof block.text === 'string') out += block.text
      }
      return out
    }

    /** First meaningful line of a skill body, for a tidy label. */
    function firstLineOf(text) {
      const lines = String(text || '').split('\n')
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].replace(/^[#>\s*-]+/, '').trim()
        if (line !== '') return line.slice(0, 24)
      }
      return ''
    }

    // ------------------------------------------------------------------- artwork

    /** One integer-aligned rectangle. */
    function R(key, x, y, width, height, fillColor, extra) {
      const base = { key, x, y, width, height, fill: fillColor }
      return extra ? h('rect', Object.assign(base, extra)) : h('rect', base)
    }

    /**
     * A small workstation, drawn like the two large desks but compact: the desk
     * surface with its monitor and bookshelf on top, its owner seated in front.
     */
    function smallDesk(def) {
      const s = def.scale
      const k = def.row + '' + def.col
      const parts = []
      parts.push(R('shadow' + k, -22, 0, 44, 3, '#1b2136', { opacity: 0.4 }))
      // Desk: top slab, front panel, two legs.
      parts.push(R('top' + k, -22, -20, 44, 5, '#b9824c'))
      parts.push(R('edge' + k, -22, -20, 44, 1, '#c99a63'))
      parts.push(R('front' + k, -20, -15, 40, 6, '#96613a'))
      parts.push(R('legA' + k, -18, -9, 2, 9, '#6b4023'))
      parts.push(R('legB' + k, 16, -9, 2, 9, '#6b4023'))
      // Monitor standing on the top surface, screen facing the viewer.
      parts.push(R('monStand' + k, -2, -22, 4, 2, '#1b2033'))
      parts.push(R('mon' + k, -9, -33, 18, 12, '#1b2033'))
      parts.push(R('screen' + k, -7, -31, 14, 8, '#2f6f7a'))
      // The chair stays even while its owner is away.
      parts.push(R('seatBack' + k, -8, -12, 16, 11, '#2b3350'))
      parts.push(R('seatTop' + k, -8, -12, 16, 2, '#3a4468'))
      parts.push(R('seatPost' + k, -2, -1, 4, 1, '#1b2136'))
      // Mug on the desk's left end: this Agent's own extra rules.
      parts.push(R('mug' + k, -19, -22, 5, 5, '#e05a5a'))
      parts.push(R('mugHandle' + k, -14, -21, 2, 3, '#c04343'))
      // Bookshelf on the desk's right end.
      parts.push(R('shelf' + k, 11, -35, 10, 15, '#6b4a2f'))
      parts.push(R('shelfIn' + k, 12, -34, 8, 7, '#4f351f'))
      parts.push(R('book1' + k, 13, -33, 2, 5, '#e0566f'))
      parts.push(R('book2' + k, 16, -32, 2, 4, '#5b8def'))
      parts.push(R('book3' + k, 19, -33, 2, 5, '#54b98a'))
      return h('g', {
        key: 'small' + k,
        transform: 'translate(' + def.personX + ' ' + def.feetY + ') scale(' + s + ')',
      }, parts)
    }

    /** A large desk seen from behind its owner: wide surface, monitor back, shelf. */
    function bigDesk(def, index) {
      const parts = []
      const k = 'big' + index
      // Floor shadow.
      parts.push(R(k + 'shadow', -54, 0, 108, 5, '#1b2136', { opacity: 0.45 }))
      // Desk: the near edge is hidden behind its owner, the far edge carries the monitor.
      parts.push(R(k + 'top', -50, -40, 100, 10, '#b9824c'))
      parts.push(R(k + 'edge', -50, -40, 100, 2, '#c99a63'))
      parts.push(R(k + 'front', -46, -30, 92, 12, '#96613a'))
      parts.push(R(k + 'drawer', -20, -26, 40, 2, '#7d4f2e'))
      parts.push(R(k + 'legA', -44, -18, 4, 18, '#6b4023'))
      parts.push(R(k + 'legB', 40, -18, 4, 18, '#6b4023'))
      // Monitor faces its owner, so its lit screen faces the viewer.
      parts.push(R(k + 'monStand', -3, -42, 6, 4, '#2b3350'))
      parts.push(R(k + 'mon', -16, -58, 32, 18, '#1b2033'))
      parts.push(R(k + 'screen', -13, -55, 26, 13, '#2f6f7a'))
      // Chair behind the owner, matching the sprite's own seat.
      parts.push(R(k + 'seatBack', -12, -12, 24, 10, '#2b3350'))
      parts.push(R(k + 'seatTop', -12, -12, 24, 2, '#3a4468'))
      parts.push(R(k + 'seatPost', -2, -2, 4, 1, '#1b2136'))
      // Bookshelf with books.
      parts.push(R(k + 'shelf', 20, -60, 24, 20, '#6b4a2f'))
      parts.push(R(k + 'shelfIn', 21, -58, 22, 16, '#4f351f'))
      parts.push(R(k + 'sb1', 23, -56, 4, 10, '#e0566f'))
      parts.push(R(k + 'sb2', 28, -55, 3, 9, '#5b8def'))
      parts.push(R(k + 'sb3', 32, -56, 4, 10, '#54b98a'))
      parts.push(R(k + 'sb4', 36, -54, 3, 8, '#e8b84a'))
      parts.push(R(k + 'board', 21, -44, 22, 2, '#7d5a3a'))
      parts.push(R(k + 'sb5', 23, -42, 4, 4, '#b06bd1'))
      parts.push(R(k + 'sb6', 29, -42, 3, 4, '#48b0c9'))
      // Mug on the desk.
      parts.push(R(k + 'mug', -38, -46, 5, 6, '#e05a5a'))
      return h('g', {
        key: k,
        transform: 'translate(' + def.personX + ' ' + def.feetY + ') scale(' + def.scale + ')',
      }, parts)
    }

    /** Room backdrop: wall, window, board, clock, shelf, perspective floor, ten desks. */
    function RoomArtInner() {
      const parts = []
      const add = (element) => { parts.push(element) }

      add(R('wall', 0, 0, ROOM_W, 40, '#232a44'))
      add(R('wallTop', 0, 0, ROOM_W, 4, '#2b3355'))
      add(R('baseboard', 0, 36, ROOM_W, 4, '#1a2038'))

      // Everything static is laid out for the original 360-wide room and shifted
      // right so it stays centred in the wider room.
      const decorStart = parts.length

      // Window.
      add(R('winFrame', 14, 4, 72, 32, '#0e1322'))
      add(R('winGlass', 17, 7, 66, 26, '#9fd8ff'))
      add(R('winSky', 17, 7, 66, 8, '#bfe6ff'))
      add(R('cloud1', 22, 12, 16, 3, '#eef9ff'))
      add(R('cloud1b', 28, 9, 9, 3, '#eef9ff'))
      add(R('cloud2', 48, 18, 18, 3, '#eef9ff'))
      add(R('cloud2b', 56, 15, 9, 3, '#eef9ff'))
      add(R('hill', 17, 28, 66, 5, '#7fc3ea'))
      add(R('mullionV', 49, 7, 3, 26, '#0e1322'))
      add(R('mullionH', 17, 20, 66, 2, '#0e1322'))
      add(R('winSill', 11, 34, 78, 3, '#2b3355'))

      // Whiteboard.
      add(R('board', 104, 4, 92, 30, '#e9e7df'))
      add(R('boardInner', 106, 6, 88, 26, '#f8f7f2'))
      add(R('note1', 112, 10, 9, 9, '#f2c14e'))
      add(R('note2', 124, 16, 9, 9, '#7fd1a8'))
      add(R('note3', 137, 9, 9, 9, '#f08a8a'))
      add(R('bline1', 151, 11, 30, 2, '#b9bdcb'))
      add(R('bline2', 151, 17, 24, 2, '#b9bdcb'))
      add(R('bline3', 151, 23, 28, 2, '#b9bdcb'))
      add(R('bline4', 112, 25, 12, 2, '#b9bdcb'))

      // Clock.
      add(h('circle', { key: 'clock', cx: 220, cy: 18, r: 9, fill: '#2b3355' }))
      add(h('circle', { key: 'clockFace', cx: 220, cy: 18, r: 7, fill: '#e9e7df' }))
      add(R('clockH', 219, 13, 2, 6, '#2b3355'))
      add(R('clockM', 220, 17, 6, 2, '#2b3355'))

      // Wall shelf with books.
      add(R('wb1', 248, 10, 4, 12, '#e0566f'))
      add(R('wb2', 253, 13, 3, 9, '#5b8def'))
      add(R('wb3', 257, 8, 5, 14, '#54b98a'))
      add(R('wb4', 263, 12, 3, 10, '#e8b84a'))
      add(R('wb5', 267, 10, 4, 12, '#b06bd1'))
      add(R('wb6', 272, 13, 4, 9, '#48b0c9'))
      add(R('wshelf', 242, 22, 46, 3, '#6b4a2f'))
      add(R('wArmL', 246, 25, 2, 4, '#4f351f'))
      add(R('wArmR', 280, 25, 2, 4, '#4f351f'))

      const decor = parts.splice(decorStart, parts.length - decorStart)
      add(h('g', { key: 'decor', transform: 'translate(' + ((ROOM_W - 360) / 2) + ' 0)' }, decor))

      // Perspective floor: bands grow toward the viewer.
      const bands = 12
      const heights = []
      let total = 0
      for (let index = 0; index < bands; index += 1) {
        const raw = 9 + index * 1.9
        heights.push(raw)
        total += raw
      }
      const fit = (ROOM_H - 40) / total
      let y = 40
      for (let index = 0; index < bands; index += 1) {
        const height = heights[index] * fit
        add(R('floor' + index, 0, y, ROOM_W, height + 0.5, index % 2 === 0 ? '#343b5c' : '#39405f'))
        add(R('grout' + index, 0, y, ROOM_W, 1, '#2b3149', { opacity: 0.7 }))
        y += height
      }
      add(R('floorShade', 0, 40, ROOM_W, 6, '#242a42', { opacity: 0.5 }))

      // Rugs: one under the whole desk area, one runner in the corridor.
      add(R('areaRug', 30, 188, 382, 60, '#3a3550', { opacity: 0.5 }))
      add(R('areaRugTrim', 34, 190, 374, 2, '#54496e', { opacity: 0.6 }))
      add(R('aisleRug', 96, 160, 250, 12, '#6b4a6f', { opacity: 0.45 }))
      add(R('aisleRugTrim', 100, 161, 242, 1, '#8a6b8f', { opacity: 0.55 }))
      // Side furniture: a filing cabinet and a water cooler, off to each wall.
      add(R('cabinet', 8, 150, 20, 26, '#4f5a7a'))
      add(R('cabinetTop', 8, 150, 20, 3, '#6b7a9e'))
      add(R('drawer1', 11, 156, 14, 1, '#3a4468'))
      add(R('drawer2', 11, 162, 14, 1, '#3a4468'))
      add(R('cooler', 410, 132, 18, 34, '#5b6278'))
      add(R('coolerTop', 410, 132, 18, 3, '#8a90a8'))
      add(R('coolerBottle', 414, 118, 10, 14, '#9fd8ff'))
      add(R('coolerTap', 416, 148, 3, 6, '#3a4468'))

      // Eight small desks, far row first so the near row paints over it.
      for (let index = 0; index < SMALL_SEATS.length; index += 1) add(smallDesk(SMALL_SEATS[index]))
      // The two large desks.
      for (let index = 0; index < BIG_SEATS.length; index += 1) add(bigDesk(BIG_SEATS[index], index))

      // Odds and ends, deliberately off-centre.
      add(R('posterA', 300, 6, 18, 22, '#e8b84a'))
      add(R('posterB', 304, 10, 10, 12, '#f2f6ff', { opacity: 0.7 }))
      // Cat tower and dog bed sit under the window, off to the left.
      add(R('towerRug', 66, 72, 20, 3, '#3f3452'))
      add(R('towerBase', 68, 68, 15, 3, '#4f5a7a'))
      add(R('towerPost', 72, 46, 3, 22, '#6b4a2f'))
      add(R('towerTop', 66, 40, 13, 5, '#5b8def'))
      add(R('towerMid', 68, 56, 9, 4, '#b06bd1'))
      add(R('towerHole', 69, 47, 5, 4, '#2f3450'))
      add(R('dogBed', 28, 66, 20, 6, '#7a4f5f'))
      add(R('dogBedIn', 30, 67, 16, 4, '#b06a7f'))
      add(R('bowl', 22, 74, 9, 3, '#8a90a8'))
      add(R('bowlIn', 23, 75, 7, 1, '#5b6278'))
      add(R('kibble', 24, 74, 4, 1, '#c98b3f'))

      // Ambience: wall plants and a rug strip in the foreground.
      const frontStart = parts.length
      add(R('potA', 6, 50, 10, 9, '#8a5a3b'))
      add(R('potARim', 4, 48, 14, 3, '#a06b45'))
      add(R('leafA1', 4, 40, 5, 9, '#3f9a72'))
      add(R('leafA2', 10, 38, 5, 11, '#54b98a'))
      add(R('potB', 346, 50, 12, 10, '#8a5a3b'))
      add(R('potBRim', 344, 48, 16, 3, '#a06b45'))
      add(R('leafB1', 344, 40, 6, 11, '#54b98a'))
      add(R('leafB2', 350, 38, 6, 9, '#3f9a72'))
      add(R('rug', 18, 252, 324, 6, '#3c2f52'))
      add(R('rugInner', 24, 254, 312, 2, '#4a3a63'))

      const foreground = parts.splice(frontStart, parts.length - frontStart)
      add(h('g', { key: 'foreground', transform: 'translate(' + ((ROOM_W - 360) / 2) + ' 0)' }, foreground))

      return h('svg', {
        className: 'po-scene',
        viewBox: '0 0 ' + ROOM_W + ' ' + ROOM_H,
        preserveAspectRatio: 'none',
        shapeRendering: 'crispEdges',
        'aria-hidden': 'true',
        focusable: 'false',
      }, parts)
    }

    /** The room's art never depends on props, so status ticks never repaint it. */
    const RoomArtMemo = React.memo(RoomArtInner)

    /** One Agent sprite in the orientation its seat faces. */
    function Sprite({ variant, palette, state, legs }) {
      const p = palette
      const parts = []
      const add = (element) => { parts.push(element) }
      const idleEyes = state === 'idle'

      if (variant === 'back') {
        // Seen from behind: hair, neck, shoulders, and the chair back. The body
        // bobs while the Agent types; the chair never moves.
        const hair = p.hair
        const gear = typeof p.gear === 'number' ? p.gear : 0
        const style = typeof p.style === 'number' ? p.style : 0
        const body = []
        const dark = shade(p.shirt, 0.78)
        const light = shade(p.shirt, 1.22)
        const outfit = typeof p.outfit === 'number' ? p.outfit : 0
        body.push(h('g', { key: 'headGroup', className: 'po-head' },
          R('bHair', 7, 0, 12, 11, hair),
          style === 1 ? R('bHairLong', 5, 9, 16, 9, hair) : null,
          style === 2 ? h('circle', { key: 'bBun', cx: 13, cy: 0, r: 3.2, fill: hair }) : null,
          style === 3 ? h('g', { key: 'bCurls' },
            h('circle', { key: 'c1', cx: 8, cy: 2, r: 2.6, fill: hair }),
            h('circle', { key: 'c2', cx: 13, cy: 1, r: 2.8, fill: hair }),
            h('circle', { key: 'c3', cx: 18, cy: 2, r: 2.6, fill: hair })) : null,
          style === 4 ? h('g', { key: 'bSpikes' },
            h('polygon', { key: 's1', points: '7,2 10,2 8,-2', fill: hair }),
            h('polygon', { key: 's2', points: '11,1 14,1 13,-3', fill: hair }),
            h('polygon', { key: 's3', points: '15,2 18,2 17,-1', fill: hair })) : null,
          style === 5 ? h('g', { key: 'bPart' },
            R('bPartA', 7, 0, 8, 7, hair),
            R('bPartB', 15, 2, 4, 6, hair)) : null,
          style === 6 ? h('g', { key: 'bPony' },
            R('bPonyTail', 19, 3, 3, 10, hair),
            R('bPonyBand', 18, 4, 2, 2, dark)) : null,
          style === 7 ? R('bBuzz', 8, 2, 10, 5, hair, { opacity: 0.55 }) : null,
          R('bShine', 9, 1, 8, 2, '#ffffff', { opacity: 0.12 }),
          R('bEarL', 5, 7, 2, 4, p.skin),
          R('bEarR', 19, 7, 2, 4, p.skin),
          R('bNeck', 11, 11, 4, 3, p.skin),
          gear === 1 ? h('g', { key: 'bCap' },
            R('bCapTop', 6, -1, 14, 4, '#e0566f'),
            R('bCapBrim', 16, 2, 8, 2, '#b84458')) : null,
          gear === 2 ? h('g', { key: 'bHeadset' },
            R('bBand', 5, 1, 16, 2, '#25222c'),
            R('bCupL', 4, 6, 2, 5, '#25222c'),
            R('bCupR', 20, 6, 2, 5, '#25222c')) : null,
          gear === 3 ? h('g', { key: 'bBeanie' },
            R('bBeanieTop', 6, -2, 14, 6, '#48b0c9'),
            R('bBeanieRim', 6, 3, 14, 2, '#3a8fa6'),
            R('bBeaniePom', 12, -3, 3, 3, '#cdeef5')) : null,
          gear === 4 ? h('g', { key: 'bPhones' },
            R('bPhoneBand', 4, 1, 18, 2, '#2b3350'),
            R('bPhoneL', 3, 6, 4, 6, '#2b3350'),
            R('bPhoneR', 19, 6, 4, 6, '#2b3350')) : null))
        if (outfit === 2) body.push(R('bHood', 6, 11, 14, 5, dark))
        body.push(h('g', { key: 'torsoGroup' },
          R('bTorso', 4, 14, 18, 13, p.shirt),
          R('bCollar', 9, 14, 8, 2, '#ffffff', { opacity: 0.2 }),
          outfit === 1 ? h('g', { key: 'bFlaps' },
            R('bFlapL', 7, 14, 4, 4, dark),
            R('bFlapR', 15, 14, 4, 4, dark)) : null,
          outfit === 3 ? h('g', { key: 'bStripes' },
            R('bStripeA', 5, 17, 16, 2, '#ffffff', { opacity: 0.22 }),
            R('bStripeB', 5, 22, 16, 2, '#ffffff', { opacity: 0.22 })) : null,
          outfit === 4 ? h('g', { key: 'bVest' },
            R('bVestA', 8, 14, 10, 13, dark),
            R('bVestB', 11, 14, 4, 13, light, { opacity: 0.35 })) : null))
        body.push(h('g', { key: 'armDesk', className: 'po-armDesk' },
          R('bArmL', 1, 16, 3, 9, outfit === 4 ? p.skin : p.shirt),
          R('bArmR', 22, 16, 3, 9, outfit === 4 ? p.skin : p.shirt)))
        add(h('g', { key: 'workBody', className: 'po-workBody' }, body))
        add(h('g', { key: 'chairGroup' },
          R('chairBack', 2, 23, 22, 9, '#2b3350'),
          R('chairTop', 2, 23, 22, 2, '#3a4468'),
          R('chairPost', 11, 32, 4, 2, '#1b2136')))
        if (state === 'waiting' || state === 'done') {
          add(R('bRaise', 22, 5, 3, 10, p.shirt))
          add(R('bRaiseHand', 22, 1, 4, 4, p.skin))
        }
        return h('svg', {
          className: 'po-spriteSvg',
          viewBox: '0 0 26 34',
          width: '100%',
          height: 'auto',
          shapeRendering: 'crispEdges',
          'aria-hidden': 'true',
          focusable: 'false',
          'data-state': state,
        }, parts)
      }

      if (variant === 'left' || variant === 'right') {
        const flip = variant === 'right'
        // Seated: legs under the desk, torso upright, chair behind. The walker
        // keeps the standing variant with feet.
        if (!legs) {
          add(h('g', { key: 'headGroup', className: 'po-head' },
            R('sHair', 6, 0, 10, 4, p.hair),
            R('sHairBack', 12, 3, 5, 6, p.hair),
            R('sHead', 5, 3, 9, 9, p.skin),
            R('sNose', 4, 6, 1, 2, p.skin),
            idleEyes
              ? R('sEye', 6, 7, 2, 1, '#25222c')
              : R('sEye', 6, 6, 1, 2, '#25222c'),
            R('sMouth', 5, 10, 2, 1, '#b06a5a'),
            p.variant === 'headset'
              ? h('g', { key: 'sHeadset' },
                R('sBand', 6, 0, 8, 2, '#25222c'),
                R('sCup', 11, 4, 2, 4, '#25222c'))
              : null,
            p.variant === 'cap'
              ? h('g', { key: 'sCap' },
                R('sCapTop', 6, -1, 10, 3, '#e0566f'),
                R('sCapBrim', 3, 1, 10, 1, '#b84458'))
              : null))
          add(h('g', { key: 'torsoGroup' },
            R('sTorso', 6, 11, 11, 8, p.shirt),
            R('sCollar', 7, 11, 4, 1, '#ffffff', { opacity: 0.22 })))
          if (state === 'waiting' || state === 'done') {
            add(h('g', { key: 'armUp', className: 'po-armUp' },
              R('sArmUp', 14, 4, 3, 9, p.shirt),
              R('sHandUp', 13, 0, 5, 4, p.skin)))
          } else {
            add(h('g', { key: 'armDesk', className: 'po-armDesk' },
              R('sArm', 1, 12, 5, 5, p.shirt),
              R('sHand', 2, 16, 4, 3, p.skin)))
          }
          add(h('g', { key: 'lowerGroup' },
            R('sThigh', 2, 18, 9, 3, PANTS),
            R('sShin', 2, 21, 3, 3, PANTS),
            R('sShoe', 1, 22, 4, 2, SHOE)))
          const seated = h('g', { key: 'inner' }, parts.splice(0, parts.length))
          return h('svg', {
            className: 'po-spriteSvg',
            viewBox: '0 0 20 24',
            width: '100%',
            height: 'auto',
            shapeRendering: 'crispEdges',
            'aria-hidden': 'true',
            focusable: 'false',
            'data-state': state,
          }, flip ? h('g', { transform: 'translate(20 0) scale(-1 1)' }, seated) : seated)
        }
        // Standing profile (the walker): hair style, attached arm, feet.
        const style = typeof p.style === 'number' ? p.style : 0
        const idleEyes = state === 'idle'
      add(h('g', { key: 'headGroup', className: 'po-head' },
        R('pHead', 4, 5, 9, 9, p.skin),
        R('pNose', 3, 8, 1, 2, p.skin),
        R('pEar', 11, 8, 2, 3, p.skin),
        style === 1 ? h('g', { key: 'pLong' },
          R('pLongA', 4, 1, 11, 5, p.hair),
          R('pLongB', 12, 5, 4, 12, p.hair),
          R('pLongC', 13, 3, 3, 3, p.hair)) : R('pShort', 4, 1, 11, 5, p.hair),
        style === 1 ? R('pLongD', 5, 5, 2, 7, p.hair) : null,
        style === 2 ? h('circle', { key: 'pBun', cx: 10, cy: 1.6, r: 2.6, fill: p.hair }) : null,
        style === 3 ? h('g', { key: 'pCurls' },
          h('circle', { key: 'pc1', cx: 6, cy: 2, r: 2.2, fill: p.hair }),
          h('circle', { key: 'pc2', cx: 10, cy: 1, r: 2.4, fill: p.hair }),
          h('circle', { key: 'pc3', cx: 14, cy: 2, r: 2.2, fill: p.hair })) : null,
        style === 4 ? h('g', { key: 'pSpikes' },
          h('polygon', { key: 'ps1', points: '4,2 7,2 5,-2', fill: p.hair }),
          h('polygon', { key: 'ps2', points: '8,1 11,1 10,-3', fill: p.hair }),
          h('polygon', { key: 'ps3', points: '12,2 15,2 14,-1', fill: p.hair })) : null,
        style === 6 ? h('g', { key: 'pPony' },
          R('pPonyTail', 14, 4, 3, 9, p.hair),
          R('pPonyBand', 13, 5, 2, 2, p.hair)) : null,
        style === 7 ? R('pBuzz', 5, 2, 9, 4, p.hair, { opacity: 0.55 }) : null,
        R('pFringe', 4, 5, 3, 2, p.hair),
        idleEyes
          ? R('pEye', 5, 9, 2, 1, '#25222c')
          : R('pEye', 5, 8, 1, 2, '#25222c'),
        R('pMouth', 4, 12, 2, 1, '#b06a5a'),
        p.variant === 'headset'
          ? h('g', { key: 'pHeadset' },
            R('pBand', 5, 2, 9, 2, '#25222c'),
            R('pCup', 11, 6, 2, 4, '#25222c'))
          : null,
        p.variant === 'cap'
          ? h('g', { key: 'pCap' },
            R('pCapTop', 5, 0, 10, 3, '#e0566f'),
            R('pCapBrim', 2, 2, 9, 1, '#b84458'))
          : null))
      add(h('g', { key: 'torsoGroup' },
        R('pTorso', 5, 14, 11, 9, p.shirt),
        R('pCollar', 6, 14, 4, 1, '#ffffff', { opacity: 0.22 })))
      add(h('g', { key: 'armDesk', className: 'po-armDesk' },
        R('pArm', 1, 15, 4, 7, p.shirt),
        R('pHand', 1, 21, 4, 3, p.skin)))
      add(h('g', { key: 'lowerGroup' },
        R('pLegs', 6, 23, 9, 3, PANTS),
        R('pFootL', 5, 26, 4, 2, SHOE),
        R('pFootR', 11, 26, 4, 2, SHOE)))
        const inner = h('g', { key: 'inner' }, parts.splice(0, parts.length))
        return h('svg', {
          className: 'po-spriteSvg',
          viewBox: '0 0 20 28',
          width: '100%',
          height: 'auto',
          shapeRendering: 'crispEdges',
          'aria-hidden': 'true',
          focusable: 'false',
          'data-state': state,
        }, flip ? h('g', { transform: 'translate(20 0) scale(-1 1)' }, inner) : inner)
      }

      // Front view: used for the walker.
      add(h('g', { key: 'headGroup', className: 'po-head' },
        R('neck', 10, 16, 4, 2, p.skin),
        R('head', 7, 7, 10, 11, p.skin),
        R('earL', 6, 11, 1, 3, p.skin),
        R('earR', 17, 11, 1, 3, p.skin),
        R('hair', 6, 4, 12, 5, p.hair),
        R('fringeL', 6, 8, 3, 2, p.hair),
        R('fringeR', 15, 8, 3, 2, p.hair),
        R('brow', 8, 11, 8, 1, p.hair, { opacity: 0.45 }),
        idleEyes
          ? R('eyeL', 9, 13, 2, 1, '#25222c')
          : R('eyeL', 9, 12, 1, 2, '#25222c'),
        idleEyes
          ? R('eyeR', 14, 13, 2, 1, '#25222c')
          : R('eyeR', 14, 12, 1, 2, '#25222c'),
        R('mouth', 11, 16, 2, 1, '#b06a5a'),
        p.variant === 'headset'
          ? h('g', { key: 'headset' },
            R('band', 5, 5, 14, 2, '#25222c'),
            R('cupL', 4, 9, 2, 5, '#25222c'),
            R('cupR', 18, 9, 2, 5, '#25222c'),
            R('mic', 16, 13, 3, 1, '#25222c'))
          : null,
        p.variant === 'cap'
          ? h('g', { key: 'cap' },
            R('capTop', 6, 2, 12, 4, '#e0566f'),
            R('capBrim', 5, 6, 14, 1, '#b84458'))
          : null))
      add(h('g', { key: 'torsoGroup' },
        R('torso', 5, 18, 14, 16, p.shirt),
        R('collar', 9, 18, 6, 2, '#ffffff', { opacity: 0.22 })))
      add(h('g', { key: 'armL', className: 'po-armL' },
        R('armLtop', 2, 19, 3, 11, p.shirt),
        R('handL', 2, 29, 3, 4, p.skin)))
      add(h('g', { key: 'armR', className: 'po-armR' },
        R('armRtop', 19, 19, 3, 11, p.shirt),
        R('handR', 19, 29, 3, 4, p.skin)))
      if (legs) {
        add(h('g', { key: 'legs' },
          h('g', { key: 'legL', className: 'po-legL' },
            R('pantL', 8, 34, 3, 8, PANTS),
            R('shoeL', 7, 42, 4, 2, SHOE)),
          h('g', { key: 'legR', className: 'po-legR' },
            R('pantR', 13, 34, 3, 8, PANTS),
            R('shoeR', 13, 42, 4, 2, SHOE))))
      }
      return h('svg', {
        className: 'po-spriteSvg',
        viewBox: legs ? '0 0 24 44' : '0 0 24 34',
        width: '100%',
        height: 'auto',
        shapeRendering: 'crispEdges',
        'aria-hidden': 'true',
        focusable: 'false',
        'data-state': state,
      }, parts)
    }

    /** Roster avatar: just the head and shoulders. */
    function Avatar({ palette }) {
      return h('svg', {
        viewBox: '0 0 16 16', width: 18, height: 18, shapeRendering: 'crispEdges',
        'aria-hidden': 'true', focusable: 'false',
      },
      R('aTorso', 2, 12, 12, 4, palette.shirt),
      R('aHead', 4, 4, 8, 8, palette.skin),
      R('aHair', 3, 2, 10, 3, palette.hair),
      R('aEyeL', 6, 7, 1, 2, '#25222c'),
      R('aEyeR', 10, 7, 1, 2, '#25222c'))
    }

    /** The sidebar glyph: a pixel employee at a desk. */
    function OfficeIcon({ size }) {
      const edge = typeof size === 'number' && size > 0 ? size : 18
      return h('svg', {
        width: edge,
        height: edge,
        viewBox: '0 0 36 36',
        shapeRendering: 'crispEdges',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { display: 'block' },
      },
      R('iScreen', 24, 11, 8, 8, '#2b3350', { rx: 1 }),
      R('iGlow', 25, 12, 6, 6, '#7fd1a8'),
      R('iStand', 27, 19, 2, 3, '#2b3350'),
      R('iTorso', 12, 17, 11, 9, '#5b8def'),
      R('iCollar', 16, 17, 3, 1, '#ffffff', { opacity: 0.3 }),
      R('iHead', 13, 8, 9, 9, '#f2c9a0'),
      R('iHair', 12, 5, 11, 4, '#2f2a3a'),
      R('iEyeL', 15, 11, 1, 2, '#25222c'),
      R('iEyeR', 19, 11, 1, 2, '#25222c'),
      R('iArmL', 9, 19, 3, 7, '#5b8def'),
      R('iArmR', 23, 22, 3, 4, '#5b8def'),
      R('iDesk', 5, 26, 26, 3, '#b9824c'),
      R('iDeskEdge', 5, 29, 26, 2, '#8a5a33'),
      R('iLegL', 8, 31, 2, 3, '#6b4023'),
      R('iLegR', 26, 31, 2, 3, '#6b4023'))
    }

    // -------------------------------------------------------------------- pieces

    /**
     * One workstation: a clickable screen (rename / new employee), the owner's
     * sprite (opens its chat, draggable to another desk), its alert bubble, and
     * the role badge on the chair.
     */
    /** Same near-large / far-small rule the desks follow. */
    function petScale(y) {
      const depth = Math.min(1, Math.max(0, (y - 40) / 200))
      return 0.72 + depth * 0.6
    }

    /** Parse one "派工：<name or identity>｜<task>" line from a reply. */
    function parseDispatch(text) {
      const match = /派工\s*[:：]\s*([^｜|\n]+)[｜|]\s*([^\n]+)/.exec(String(text || ''))
      if (!match) return null
      return { target: match[1].trim(), task: match[2].trim() }
    }

    /** A cat or a golden retriever, drawn from the same pixel vocabulary. */
    function Pet({ kind, pose, facing }) {
      const parts = []
      if (kind === 'cat') {
        parts.push(R('cShadow', 2, 17, 18, 2, '#1b2136', { opacity: 0.35 }))
        parts.push(R('cTail', 17, 6, 3, 8, '#d9a24a'))
        parts.push(R('cBody', 3, 7, 13, 8, '#e8b84a'))
        parts.push(R('cChest', 4, 12, 7, 3, '#f3cf82'))
        parts.push(R('cHead', 5, 3, 8, 7, '#e8b84a'))
        parts.push(R('cEarA', 5, 1, 3, 3, '#d9a24a'))
        parts.push(R('cEarB', 10, 1, 3, 3, '#d9a24a'))
        parts.push(R('cEyeA', 6, 5, 1, 2, '#25222c'))
        parts.push(R('cEyeB', 10, 5, 1, 2, '#25222c'))
        parts.push(R('cNose', 8, 7, 1, 1, '#b06a5a'))
        parts.push(R('cWhiskA', 3, 7, 2, 1, '#f7f3e8'))
        parts.push(R('cWhiskB', 12, 7, 2, 1, '#f7f3e8'))
        if (pose === 'sleep') {
          parts.push(R('cLidA', 6, 5, 2, 1, '#25222c'))
          parts.push(R('cLidB', 10, 5, 2, 1, '#25222c'))
          parts.push(R('cNoseTuck', 5, 8, 6, 3, '#e8b84a'))
        }
        if (pose === 'walk' || pose === 'stretch') {
          parts.push(R('cPawA', 4, 15, 2, 3, '#d9a24a'))
          parts.push(R('cPawB', 12, 15, 2, 3, '#d9a24a'))
        }
      } else {
        // Golden retriever: long body, floppy ear, feathered tail.
        parts.push(R('dShadow', 1, 21, 24, 2, '#1b2136', { opacity: 0.35 }))
        parts.push(R('dTail', 0, 6, 4, 6, '#e0b25f'))
        parts.push(R('dTailTip', 0, 5, 3, 3, '#f0cf8f'))
        parts.push(R('dBody', 3, 8, 18, 9, '#d9a24a'))
        parts.push(R('dBelly', 5, 14, 13, 3, '#f0cf8f'))
        parts.push(R('dHead', 15, 4, 11, 9, '#d9a24a'))
        parts.push(R('dMuzzle', 21, 8, 5, 4, '#f0cf8f'))
        parts.push(R('dNose', 25, 9, 1, 2, '#25222c'))
        parts.push(R('dEye', 19, 6, 1, 2, '#25222c'))
        parts.push(R('dEar', 15, 6, 4, 7, '#b07f36'))
        parts.push(R('dEarIn', 16, 7, 2, 5, '#c98b3f'))
        if (pose === 'eat') {
          parts.push(R('dHeadDown', 15, 10, 11, 8, '#d9a24a'))
          parts.push(R('dMuzzleDown', 21, 14, 5, 4, '#f0cf8f'))
        }
        if (pose === 'bark') {
          parts.push(R('dJaw', 22, 13, 4, 3, '#f0cf8f'))
          parts.push(R('dTongue', 23, 15, 2, 2, '#e0566f'))
        }
        parts.push(R('dLegA', 4, 17, 3, 6, '#c98b3f'))
        parts.push(R('dLegB', 8, 17, 3, 6, '#c98b3f'))
        parts.push(R('dLegC', 14, 17, 3, 6, '#c98b3f'))
        parts.push(R('dLegD', 18, 17, 3, 6, '#c98b3f'))
      }
      return h('svg', {
        className: 'po-petSvg',
        viewBox: kind === 'cat' ? '0 0 22 19' : '0 0 28 23',
        shapeRendering: 'crispEdges',
        'aria-hidden': 'true',
        focusable: 'false',
        style: { transform: facing < 0 ? 'scaleX(-1)' : 'none' },
      }, parts)
    }

    function Station({ seat, t, away, role, label, onSelect, onOpenEditor, onOpenSkills, onOpenMug, onDropAgent, quip }) {
      const def = seat.def
      const agent = seat.agent
      const state = agent ? (away ? 'idle' : agent.state) : 'idle'
      const alert = agent && !away
        ? (state === 'waiting' ? t('needsApproval') : (state === 'done' ? t('needsReview') : ''))
        : ''
      const onDragOver = (event) => {
        const types = event.dataTransfer && event.dataTransfer.types
        if (!types || Array.prototype.indexOf.call(types, 'text/plain') < 0) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }
      const onDrop = (event) => {
        event.preventDefault()
        const id = event.dataTransfer.getData('text/plain')
        if (id) onDropAgent(id, seat.key)
      }
      const parts = []
      // The whole desk is a drop target for a dragged Agent; nothing is painted.
      parts.push(h('div', {
        key: 'drop',
        className: 'po-dropZone',
        style: {
          left: ((def.personX - 24 * def.scale) / ROOM_W) * 100 + '%',
          top: ((def.feetY - 44 * def.scale) / ROOM_H) * 100 + '%',
          width: ((48 * def.scale) / ROOM_W) * 100 + '%',
          height: ((48 * def.scale) / ROOM_H) * 100 + '%',
        },
        onDragOver: onDragOver,
        onDrop: onDrop,
      }))
      // Every desk keeps a chair, even before someone sits down.
      if (!agent) {
        parts.push(h('svg', {
          key: 'chair',
          className: 'po-spriteSvg po-chairEmpty',
          viewBox: '0 0 26 34',
          style: {
            position: 'absolute',
            left: (def.personX / ROOM_W) * 100 + '%',
            top: (def.feetY / ROOM_H) * 100 + '%',
            width: (def.spriteW / ROOM_W) * 100 + '%',
            transform: 'translate(-50%,-100%)',
          },
        },
        R('eBack', 2, 23, 22, 9, '#2b3350'),
        R('eTop', 2, 23, 22, 2, '#3a4468'),
        R('ePost', 11, 32, 4, 2, '#1b2136')))
      }
      // The screen is the identity label: clicking it renames the owner, or opens
      // a new-employee form on an empty desk. It is also the drop target.
      parts.push(h('button', {
        type: 'button',
        className: 'po-screenBtn',
        'aria-label': (agent ? agent.name : t('emptySeat')) + ' · ' + t('rename'),
        style: {
          left: ((def.screenX - def.screenW / 2) / ROOM_W) * 100 + '%',
          top: ((def.screenY - def.screenH / 2) / ROOM_H) * 100 + '%',
          width: (def.screenW / ROOM_W) * 100 + '%',
          height: (def.screenH / ROOM_H) * 100 + '%',
        },
        onClick: () => { onOpenEditor(seat) },
        onDragOver: onDragOver,
        onDrop: onDrop,
      }))
      if (agent) {
        parts.push(h('button', {
          type: 'button',
          tabIndex: -1,
          'aria-hidden': 'true',
          className: 'po-spriteBtn',
          'data-state': state,
          draggable: true,
          style: {
            left: (def.personX / ROOM_W) * 100 + '%',
            top: (def.feetY / ROOM_H) * 100 + '%',
            width: (def.spriteW / ROOM_W) * 100 + '%',
            visibility: away ? 'hidden' : 'visible',
          },
          onClick: onSelect,
          onDragStart: (event) => {
            event.dataTransfer.setData('text/plain', agent.id)
            event.dataTransfer.effectAllowed = 'move'
            // Hide the browser's default drag ghost; it painted a white box.
            if (typeof Image === 'function' && typeof event.dataTransfer.setDragImage === 'function') {
              const ghost = new Image()
              ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
              event.dataTransfer.setDragImage(ghost, 0, 0)
            }
          },
          onDragOver: onDragOver,
          onDrop: onDrop,
        }, h(Sprite, { variant: def.variant, palette: agent.palette, state: state })))
        if (alert !== '') {
          parts.push(h('div', {
            className: 'po-alert',
            'data-kind': state,
            'aria-hidden': 'true',
            style: {
              left: (def.alertX / ROOM_W) * 100 + '%',
              top: ((def.alertY + 3) / ROOM_H) * 100 + '%',
            },
          }, alert))
        }
        // Every occupied desk wears its role on the chair back, big or small; an
        // An unset identity keeps the slot reserved without inventing a title.
        const badgeY = def.kind === 'big' ? def.feetY - 7 : def.feetY - 4 * def.scale
        parts.push(h('button', {
          type: 'button',
          className: 'po-chairRole po-role' + (def.kind === 'big' ? '' : ' po-roleSmall') + (role === '' ? ' po-chairSlot' : ''),
          'data-role': role,
          'data-kind': def.kind,
          'aria-label': agent.name + ' · ' + t('roleLabel'),
          style: {
            left: (def.personX / ROOM_W) * 100 + '%',
            top: (badgeY / ROOM_H) * 100 + '%',
            ...(label !== '' ? { background: identityColor(label) } : {}),
          },
          onClick: (event) => { event.stopPropagation(); onOpenEditor(seat, 'role') },
        }, label !== '' ? label : '＋'))
        // The bookshelf is the skill area for its owner.
        parts.push(h('button', {
          type: 'button',
          className: 'po-shelfBtn',
          'aria-label': agent.name + ' · ' + t('skills'),
          style: {
            left: ((def.shelfX - def.shelfW / 2) / ROOM_W) * 100 + '%',
            top: ((def.shelfY - def.shelfH / 2) / ROOM_H) * 100 + '%',
            width: (def.shelfW / ROOM_W) * 100 + '%',
            height: (def.shelfH / ROOM_H) * 100 + '%',
          },
          onClick: (event) => { event.stopPropagation(); onOpenSkills(seat) },
        }))
        // The mug holds the rules that only this Agent follows.
        parts.push(h('button', {
          type: 'button',
          className: 'po-mugBtn',
          'aria-label': agent.name + ' · ' + t('agentRules'),
          style: {
            left: ((def.mugX - def.mugW / 2) / ROOM_W) * 100 + '%',
            top: ((def.mugY - def.mugH / 2) / ROOM_H) * 100 + '%',
            width: (def.mugW / ROOM_W) * 100 + '%',
            height: (def.mugH / ROOM_H) * 100 + '%',
          },
          onClick: (event) => { event.stopPropagation(); onOpenMug(seat) },
        }))
      }
      if (agent && quip && quip.agentId === agent.id) {
        parts.push(h('div', {
          className: 'po-quip',
          'aria-hidden': 'true',
          style: {
            left: (def.alertX / ROOM_W) * 100 + '%',
            top: ((def.alertY - 10) / ROOM_H) * 100 + '%',
          },
        }, quip.text))
      }
      return h(React.Fragment, null, parts)
    }

    /** Names printed inside each monitor's screen, sized to the screen. */
    function ScreenNames({ seats, t }) {
      const parts = []
      for (let index = 0; index < seats.length; index += 1) {
        const seat = seats[index]
        const def = seat.def
        const big = def.kind === 'big'
        const raw = String(seat.agent ? seat.agent.name : '')
        const max = big ? 11 : 7
        parts.push(h('text', {
          key: 's' + index,
          x: def.screenX,
          y: def.screenY,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          fill: seat.agent ? '#c8ece6' : 'rgba(200,236,230,.5)',
          'font-size': big ? 3.6 : 3.1 * def.scale,
          'font-family': 'ui-monospace, Consolas, monospace',
        }, seat.agent
          ? (raw.length > max ? raw.slice(0, max - 1) + '…' : raw)
          : t('emptySeat')))
      }
      return h('svg', {
        className: 'po-screenNames',
        viewBox: '0 0 ' + ROOM_W + ' ' + ROOM_H,
        preserveAspectRatio: 'none',
        'aria-hidden': 'true',
        focusable: 'false',
      }, parts)
    }

    /** The map itself: room art, the ten stations, the walker. */
    function Stage({ scene, t, size }) {
      return h('div', {
        className: 'po-stage',
        style: size ? { width: size.width + 'px', height: size.height + 'px' } : null,
      },
        h(RoomArtMemo, null),
        h(ScreenNames, { seats: scene.seats, t: t }),
        scene.board
          ? h('button', {
            type: 'button',
            className: 'po-boardBtn',
            'aria-label': t('rules'),
            onClick: scene.board.onOpen,
          },
          h('span', { className: 'po-boardTitle' }, t('rules')),
          scene.board.lines.length === 0
            ? h('span', { className: 'po-boardEmpty' }, t('rulesEmpty'))
            : scene.board.lines.slice(0, 5).map((line, index) => h('span', {
              key: 'r' + index,
              className: 'po-boardLine',
            }, (index + 1) + '. ' + line)))
          : null,
        h('div', { className: 'po-pets' },
          h('span', {
            className: 'po-pet po-petCat',
            style: {
              left: (scene.cat.x / ROOM_W) * 100 + '%',
              top: (scene.cat.y / ROOM_H) * 100 + '%',
              width: (3.0 * petScale(scene.cat.y)) + '%',
            },
          }, h(Pet, Object.assign({ kind: 'cat' }, scene.cat))),
          h('span', {
            className: 'po-pet po-petDog',
            style: {
              left: (scene.dog.x / ROOM_W) * 100 + '%',
              top: (scene.dog.y / ROOM_H) * 100 + '%',
              width: (4.6 * petScale(scene.dog.y)) + '%',
            },
          }, h(Pet, Object.assign({ kind: 'dog' }, scene.dog))),
          scene.petSay
            ? h('span', {
              className: 'po-petSay',
              style: {
                left: (((scene.petSay.kind === 'cat' ? scene.cat.x : scene.dog.x)) / ROOM_W) * 100 + '%',
                top: (((scene.petSay.kind === 'cat' ? scene.cat.y : scene.dog.y) - 22) / ROOM_H) * 100 + '%',
              },
            }, scene.petSay.text)
            : null),
        h('div', { className: 'po-layer' },
          scene.seats.map((seat) => h(Station, {
            key: seat.key,
            seat: seat,
            t: t,
            selected: scene.selectedId === (seat.agent ? seat.agent.id : ''),
            role: seat.role,
            label: seat.label,
            onSelect: seat.agent ? seat.agent.onSelect : null,
            onOpenEditor: scene.onOpenEditor,
            onOpenSkills: scene.onOpenSkills,
            onOpenMug: scene.onOpenMug,
            onDropAgent: scene.onDropAgent,
            quip: scene.quip,
            away: !!scene.stroll && seat.agent !== null && scene.stroll.agentId === seat.agent.id,
          })),
          scene.stroll
            ? (() => {
              const seat = scene.seats.find((entry) => entry.agent && entry.agent.id === scene.stroll.agentId)
              if (!seat) return null
              return h('button', {
                key: 'stroll',
                type: 'button',
                className: 'po-stroller',
                'aria-hidden': 'true',
                style: {
                  left: (scene.stroll.x / ROOM_W) * 100 + '%',
                  top: (scene.stroll.y / ROOM_H) * 100 + '%',
                  width: (seat.def.spriteW * (0.78 + Math.min(1, Math.max(0, (scene.stroll.y - 40) / 200)) * 0.5) / ROOM_W) * 100 + '%',
                },
                onClick: seat.agent.onSelect,
              }, h(Sprite, {
                variant: scene.stroll.facing < 0 ? 'left' : 'right',
                palette: seat.agent.palette,
                state: 'idle',
                legs: true,
              }))
            })()
            : null),
        scene.notice
          ? h('div', { className: 'po-sceneNotice' },
            h('span', { className: 'po-sceneNoticeTitle' }, scene.notice.title),
            scene.notice.hint ? h('span', { className: 'po-sceneNoticeHint' }, scene.notice.hint) : null,
            scene.notice.action
              ? h('button', {
                type: 'button',
                className: 'po-btn po-btnPrimary',
                onClick: scene.notice.action.onClick,
              }, scene.notice.action.label)
              : null)
          : null)
    }

    /** Subscribe to one observable store, or report absence when there is none. */
    function useStore(store) {
      const subscribe = React.useCallback((listener) => (store ? store.subscribe(listener) : () => {}), [store])
      const getSnapshot = React.useCallback(() => (store ? store.getSnapshot() : null), [store])
      return React.useSyncExternalStore(subscribe, getSnapshot)
    }

    /** A neutral pixel avatar for the person at the keyboard. */
    const USER_PALETTE = { hair: '#2f2a3a', shirt: '#8a90a8', skin: '#f2c9a0', variant: 'plain' }

    /** One image attachment, resolved through the conversation's image store. */
    function ChatImage({ attachment, sessionId, load, t, onOpen }) {
      const [url, setUrl] = React.useState(null)
      const [failed, setFailed] = React.useState(false)
      const [attempt, setAttempt] = React.useState(0)
      const attachmentId = attachment && attachment.attachmentId ? String(attachment.attachmentId) : ''
      React.useEffect(() => {
        let alive = true
        if (attachmentId === '' || typeof load !== 'function') {
          setFailed(true)
          return undefined
        }
        setFailed(false)
        Promise.resolve(load(sessionId, attachment)).then((next) => {
          if (alive && typeof next === 'string' && next !== '') setUrl(next)
        }, () => { if (alive) setFailed(true) })
        // The image store can be cold on the first render of a popup.
        const retry = setTimeout(() => { if (alive) setAttempt((value) => value + 1) }, 900)
        return () => { alive = false; clearTimeout(retry) }
      }, [attachmentId, sessionId, load, attempt])
      if (url !== null) {
        return h('img', {
          className: 'po-img',
          src: url,
          alt: (attachment && attachment.name) || '',
          title: (attachment && attachment.name) || '',
          loading: 'lazy',
          onClick: () => { if (typeof onOpen === 'function') onOpen(url, (attachment && attachment.name) || '') },
        })
      }
      return h('button', {
        type: 'button',
        className: 'po-imgPending',
        onClick: () => setAttempt((value) => value + 1),
      }, (attachment && attachment.name) || (failed ? t('image') : '…'))
    }

    /** One file attachment shown as a compact card. */
    function FileCard({ file, onOpen }) {
      const name = (file && file.name) || 'file'
      return h('button', {
        type: 'button',
        className: 'po-fileCard',
        onClick: () => { if (typeof onOpen === 'function') onOpen('', name) },
      },
        h('span', { className: 'po-fileGlyph' }, '📄'),
        h('span', { className: 'po-fileText' },
          h('span', { className: 'po-fileName' }, name),
          h('span', { className: 'po-fileSize' }, formatBytes(file && file.bytes))))
    }

    /** Readable ink for any background fill. */
    function inkOn(hex) {
      const raw = String(hex || '').replace('#', '')
      const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw
      if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#10141c'
      const value = parseInt(full, 16)
      const red = (value >> 16) & 255
      const green = (value >> 8) & 255
      const blue = value & 255
      const luma = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
      return luma > 0.6 ? '#10141c' : '#f6f8ff'
    }

    /** One WeChat-shaped chat row: avatar on the sender's side, then its bubbles. */
    function ChatRow({ node, agent, userLabel, sessionId, load, t, onOpen }) {
      const isUser = node.kind === 'user'
      const shirt = agent && agent.palette ? agent.palette.shirt : ''
      const bubbleStyle = isUser || !shirt
        ? null
        : { background: shirt, color: inkOn(shirt), borderColor: 'transparent' }
      const body = []
      for (let index = 0; index < node.paragraphs.length; index += 1) {
        const text = node.paragraphs[index]
        if (text === '') continue
        body.push(h('div', { key: 'p' + index, className: 'po-bubble', style: bubbleStyle }, text))
      }
      for (let index = 0; index < node.images.length; index += 1) {
        body.push(h(ChatImage, {
          key: 'i' + index,
          attachment: node.images[index],
          sessionId: sessionId,
          load: load,
          t: t,
          onOpen: onOpen,
        }))
      }
      for (let index = 0; index < node.files.length; index += 1) {
        body.push(h(FileCard, { key: 'f' + index, file: node.files[index] }))
      }
      if (body.length === 0) return null
      return h('div', { className: 'po-line', 'data-side': isUser ? 'user' : 'agent' },
        h('span', { className: 'po-lineAvatar', title: isUser ? userLabel : (agent ? agent.name : '') },
          isUser ? h(Avatar, { palette: USER_PALETTE }) : (agent ? h(Avatar, { palette: agent.palette }) : null)),
        h('div', { className: 'po-lineBody' }, body))
    }

    /** Compact chat with one Agent, hosted inside the office. */
    function ChatPanel({ agent, sessions, t, role, imageUrlOf, uploadFile, onSeen, onClose, onOpenFull }) {
      const [opened, setOpened] = React.useState({ reference: null, error: null })
      const [draft, setDraft] = React.useState('')
      const [attachments, setAttachments] = React.useState(EMPTY)
      const [sending, setSending] = React.useState(false)
      const [sendError, setSendError] = React.useState('')
      const [viewer, setViewer] = React.useState(null)
      const openViewer = React.useCallback((url, name) => { setViewer({ url: url || '', name: name || '' }) }, [])
      const listRef = React.useRef(null)
      const fileRef = React.useRef(null)
      const latestAttachments = React.useRef(EMPTY)
      latestAttachments.current = attachments
      const agentId = agent ? agent.id : null

      React.useEffect(() => {
        setDraft(agentId ? readDraft(agentId) : '')
        setSendError('')
        setAttachments((previous) => {
          for (let index = 0; index < previous.length; index += 1) {
            if (previous[index].url) URL.revokeObjectURL(previous[index].url)
          }
          return EMPTY
        })
      }, [agentId])

      React.useEffect(() => () => {
        const items = latestAttachments.current
        for (let index = 0; index < items.length; index += 1) {
          if (items[index].url) URL.revokeObjectURL(items[index].url)
        }
      }, [])

      React.useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        globalThis.addEventListener('keydown', onKey)
        return () => { globalThis.removeEventListener('keydown', onKey) }
      }, [onClose])

      React.useEffect(() => {
        if (!agentId || !sessions || typeof sessions.retain !== 'function') {
          setOpened({ reference: null, error: null })
          return undefined
        }
        let alive = true
        let reference = null
        try {
          reference = sessions.retain(agentId, { source: RETAIN_SOURCE })
        } catch (error) {
          setOpened({ reference: null, error: String((error && error.message) || error) })
          return undefined
        }
        setOpened({ reference: null, error: null })
        reference.ready.then(() => {
          if (alive) setOpened({ reference: reference, error: null })
        }, (error) => {
          if (alive) setOpened({ reference: null, error: String((error && error.message) || error) })
        })
        return () => {
          alive = false
          reference.release()
        }
      }, [agentId, sessions])

      const binding = opened.reference ? opened.reference.binding : null
      const session = binding ? binding.session : null
      const eventSource = binding ? binding.eventSource : null
      const snapshot = useStore(session)
      const eventWindow = useStore(eventSource)
      const view = React.useMemo(() => buildChat(eventWindow), [eventWindow])
      const running = !!(snapshot && snapshot.running)

      React.useEffect(() => {
        if (agentId && typeof onSeen === 'function') {
          onSeen(agentId, agent && typeof agent.updatedAt === 'number' ? agent.updatedAt : 0)
        }
      }, [agentId, agent, view.nodes.length, view.live.length, onSeen])

      React.useEffect(() => {
        const element = listRef.current
        if (!element) return undefined
        const pin = () => { element.scrollTop = element.scrollHeight }
        pin()
        // Images and fonts settle a frame later, so pin again after layout.
        const frame = requestAnimationFrame(pin)
        const later = window.setTimeout(pin, 120)
        return () => { cancelAnimationFrame(frame); window.clearTimeout(later) }
      }, [agentId, view.nodes.length, view.live.length])

      const addFiles = (list) => {
        if (!list || list.length === 0) return
        const next = []
        for (let index = 0; index < list.length; index += 1) {
          const file = list[index]
          const isImage = /^image\/(png|jpeg|webp|gif)$/.test(file.type)
          next.push({
            key: String(Date.now()) + ':' + index + ':' + Math.random().toString(36).slice(2, 8),
            kind: isImage ? 'image' : 'file',
            file: file,
            url: isImage ? URL.createObjectURL(file) : '',
          })
        }
        setAttachments((previous) => previous.concat(next))
      }

      const removeAttachment = (key) => {
        setAttachments((previous) => {
          const next = []
          for (let index = 0; index < previous.length; index += 1) {
            const item = previous[index]
            if (item.key === key) {
              if (item.url) URL.revokeObjectURL(item.url)
            } else next.push(item)
          }
          return next
        })
      }

      const send = () => {
        const text = draft.trim()
        if ((text === '' && attachments.length === 0) || !session || sending) return
        const pending = attachments
        setDraft('')
        if (agentId) writeDraft(agentId, '')
        setAttachments(EMPTY)
        setSendError('')
        setSending(true)
        ;(async () => {
          const parts = []
          if (text !== '') parts.push({ type: 'text', text: text })
          for (let index = 0; index < pending.length; index += 1) {
            const item = pending[index]
            if (item.kind === 'image') {
              const data = await readFileBase64(item.file)
              parts.push({ type: 'image', mediaType: item.file.type, data: data, name: item.file.name })
            } else {
              if (typeof uploadFile !== 'function') throw new Error(t('attachUnsupported'))
              const result = await uploadFile(agentId, item.file, item.file.name)
              if (!result || result.ok === false || !result.value) throw new Error(t('uploadFailed'))
              parts.push({ type: 'file', receiptId: result.value.receiptId })
            }
          }
          const response = await session.prompt(parts, 'queue')
          if (response && response.ok === false) {
            throw new Error((response.error && response.error.message) || t('sendFailed'))
          }
        })().then(() => {
          for (let index = 0; index < pending.length; index += 1) {
            if (pending[index].url) URL.revokeObjectURL(pending[index].url)
          }
        }).catch((error) => {
          setDraft(text)
          if (agentId) writeDraft(agentId, text)
          setAttachments(pending)
          setSendError(t('sendFailed') + ': ' + String((error && error.message) || error))
        }).finally(() => { setSending(false) })
      }

      const onKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          send()
        }
      }

      const stop = () => {
        if (session && typeof session.cancel === 'function') {
          Promise.resolve(session.cancel()).catch(() => {})
        }
      }

      const stateOfAgent = agent ? agent.state : 'idle'
      const head = h('div', { className: 'po-chatHead' },
        h('span', { className: 'po-avatarWrap' },
          h('span', { className: 'po-avatarBig' }, agent ? h(Avatar, { palette: agent.palette }) : null),
          agent
            ? h('i', {
              className: 'po-stateDot ' + ('po-dot-' + stateOfAgent),
              'aria-label': agent.stateLabel,
            })
            : null),
        h('span', { className: 'po-chatWho' },
          h('span', { className: 'po-chatName' },
            role !== ''
              ? h('span', {
                className: 'po-roleChip',
                'data-role': role,
                style: { background: identityColor(t(role === 'supervisor' ? 'roleSupervisor' : 'roleSecretary')) },
              }, t(role === 'supervisor' ? 'roleSupervisor' : 'roleSecretary'))
              : null,
            agent ? agent.name : '')),
        h('span', { className: 'po-chatTools' },
          h('button', {
            type: 'button',
            className: 'po-iconBtn',
            title: t('close'),
            'aria-label': t('close'),
            onClick: onClose,
          }, '✕')))

      const body = []
      if (opened.error) {
        body.push(h('div', { className: 'po-chatNotice' },
          h('span', null, t('openFailed')),
          h('button', {
            type: 'button',
            className: 'po-btn',
            onClick: () => { if (agent) onOpenFull(agent.id) },
          }, t('openInChat'))))
      } else if (!binding) {
        body.push(h('div', { className: 'po-chatNotice' }, h('span', null, t('opening'))))
      } else {
        if (view.nodes.length === 0 && view.live === '') {
          body.push(h('div', { className: 'po-chatNotice' }, h('span', null, t('emptyChat'))))
        }
        for (let index = 0; index < view.nodes.length; index += 1) {
          const node = view.nodes[index]
          body.push(h(ChatRow, {
            key: node.key,
            node: node,
            agent: agent,
            userLabel: t('you'),
            sessionId: agentId,
            load: imageUrlOf,
            t: t,
            onOpen: openViewer,
          }))
        }
        if (view.live !== '') {
          body.push(h(ChatRow, {
            key: 'live',
            node: { kind: 'assistant', paragraphs: [view.live], images: EMPTY, files: EMPTY },
            agent: agent,
            userLabel: t('you'),
            sessionId: agentId,
            load: imageUrlOf,
            t: t,
            onOpen: openViewer,
          }))
        }
        if (running && view.live === '') {
          body.push(h('div', { className: 'po-chatRunning' },
            h('i', { className: 'po-typingDot' }),
            h('span', null, t('workingNow'))))
        }
      }

      const chips = []
      for (let index = 0; index < attachments.length; index += 1) {
        const item = attachments[index]
        chips.push(h('div', { key: item.key, className: 'po-chip' },
          item.kind === 'image' && item.url
            ? h('img', { className: 'po-chipImg', src: item.url, alt: '' })
            : h('span', { className: 'po-chipGlyph' }, '📄'),
          h('span', { className: 'po-chipName' }, item.file.name || (item.kind === 'image' ? t('image') : t('file'))),
          h('button', {
            type: 'button',
            className: 'po-chipRemove',
            'aria-label': t('attachRemove'),
            title: t('attachRemove'),
            onClick: () => { removeAttachment(item.key) },
          }, '×')))
      }

      const composer = h('div', { className: 'po-compose' },
        chips.length > 0 ? h('div', { className: 'po-attachRow' }, chips) : null,
        h('div', { className: 'po-composeRow' },
          h('button', {
            type: 'button',
            className: 'po-iconBtn',
            title: t('attach'),
            'aria-label': t('attach'),
            disabled: sending,
            onClick: () => { if (fileRef.current) fileRef.current.click() },
          }, '📎'),
          h('input', {
            ref: fileRef,
            type: 'file',
            multiple: true,
            className: 'po-fileInput',
            onChange: (event) => {
              addFiles(Array.from(event.target.files || []))
              event.target.value = ''
            },
          }),
          h('textarea', {
            className: 'po-composeArea',
            value: draft,
            rows: 2,
            placeholder: t('chatPlaceholder'),
            'aria-label': t('chat'),
            onChange: (event) => {
              setDraft(event.target.value)
              if (agentId) writeDraft(agentId, event.target.value)
            },
            onKeyDown: onKeyDown,
            onPaste: (event) => {
              const files = event.clipboardData && event.clipboardData.files
              if (files && files.length > 0) {
                event.preventDefault()
                addFiles(Array.from(files))
              }
            },
          })),
        h('div', { className: 'po-composeActions' },
          running
            ? h('button', {
              type: 'button',
              className: 'po-btn',
              onClick: stop,
            }, t('stop'))
            : null,
          h('button', {
            type: 'button',
            className: 'po-btn',
            disabled: sending || !session || (draft.trim() === '' && attachments.length === 0),
            onClick: send,
          }, sending ? t('sending') : t('send'))))

      return h('div', { className: 'po-chat' },
        head,
        viewer
          ? h('div', { className: 'po-lightbox', onClick: () => setViewer(null) },
            viewer.url
              ? h('img', { className: 'po-lightboxImg', src: viewer.url, alt: viewer.name })
              : h('div', { className: 'po-lightboxName' }, viewer.name || t('file')),
            h('span', { className: 'po-lightboxHint' }, viewer.name))
          : null,
        sendError ? h('div', { className: 'po-chatError' }, sendError) : null,
        h('div', { className: 'po-chatMsgs', ref: listRef }, body),
        composer)
    }

    // ---------------------------------------------------------------------- page

    /** Error containment, so a drawing bug never strands the main panel. */
    class Boundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      componentDidCatch(error) {
        console.error('[pixel-office] panel failed', error)
        this.setState({ detail: String((error && error.message) || error) })
      }

      render() {
        if (!this.state.failed) return this.props.children
        const t = this.props.t
        return h('div', { className: 'po-page' },
          h('div', { className: 'po-crash' },
            h('h1', { className: 'po-title' }, t('crashTitle')),
            h('p', { className: 'po-sub' }, t('crashHint')),
            this.state.detail
              ? h('p', { className: 'po-sub', style: { opacity: 0.7, fontSize: '12px' } }, this.state.detail)
              : null,
            h('button', {
              type: 'button',
              className: 'po-btn',
              onClick: this.props.onBack,
            }, t('backToChat'))))
      }
    }

    /** The page body. Hooks only live here, so the boundary above can recover. */
    function OfficeView(props) {
      const t = props.t
      const sessions = props.sessions
      const sessionsState = props.useSessions((state) => state)
      const workspaces = props.useWorkspaces((state) => state)
      const statuses = props.useSessionStatus((state) => state)
      const [chosen, setChosen] = React.useState(null)
      const [officeMenu, setOfficeMenu] = React.useState(false)
      const [seenBook, setSeenBook] = React.useState(readSeen)
      const [newsBook, setNewsBook] = React.useState({})
      const [seatBook, setSeatBook] = React.useState(readSeatBook)
      const [editor, setEditor] = React.useState(null)
      const [skillPanel, setSkillPanel] = React.useState(null)
      const [rulesBook, setRulesBook] = React.useState(readRules)
      const [rulesEditor, setRulesEditor] = React.useState(null)
      const [agentRulesBook, setAgentRulesBook] = React.useState(readAgentRules)
      const [seatMemoryBook, setSeatMemoryBook] = React.useState(readSeatMemory)
      const [personaBook, setPersonaBook] = React.useState(readPersonas)
      const namesRef = React.useRef(readNames())
      const [mugEditor, setMugEditor] = React.useState(null)
      const [quip, setQuip] = React.useState(null)
      const [cat, setCat] = React.useState({ x: 80, y: 70, pose: 'sit', facing: 1 })
      const [dog, setDog] = React.useState({ x: 120, y: 90, pose: 'walk', facing: 1 })
      const [petSay, setPetSay] = React.useState(null)
      const [stroll, setStroll] = React.useState(null)
      const hoveredRef = React.useRef(false)
      const markHover = (value) => { hoveredRef.current = value }
      const sceneRef = React.useRef(null)
      const interviewRef = React.useRef(null)
      // Agent-organisation state: who is doing a delegated job for whom, and the
      // last finished run already handled.
      const delegatedRef = React.useRef({})
      const handledRef = React.useRef({})
      const [stageSize, setStageSize] = React.useState(null)

      // Size the room from the panel it sits in, so it always fits exactly once
      // the platform reports the real width and height.
      React.useEffect(() => {
        const node = sceneRef.current
        if (!node) return undefined
        const measure = () => {
          const width = node.clientWidth
          const height = node.clientHeight
          if (!(width > 0) || !(height > 0)) return
          const scale = Math.min(width / ROOM_W, height / ROOM_H)
          setStageSize({
            width: Math.round(ROOM_W * scale),
            height: Math.round(ROOM_H * scale),
          })
        }
        measure()
        if (typeof ResizeObserver === 'function') {
          const observer = new ResizeObserver(measure)
          observer.observe(node)
          return () => { observer.disconnect() }
        }
        globalThis.addEventListener('resize', measure)
        return () => { globalThis.removeEventListener('resize', measure) }
      }, [])
      const [selectedId, setSelectedId] = React.useState(null)
      const [roleBook, setRoleBook] = React.useState(readRoles)
      const [, tick] = React.useState(0)
      const tokenRef = React.useRef(0)

      React.useEffect(() => {
        const id = window.setInterval(() => { tick((value) => value + 1) }, 30000)
        return () => { window.clearInterval(id) }
      }, [])

      const items = workspaces && workspaces.items ? workspaces.items : EMPTY
      const byId = sessionsState && sessionsState.byId ? sessionsState.byId : {}
      const projections = sessionsState && sessionsState.projectionsBySession
        ? sessionsState.projectionsBySession
        : {}
      const archived = workspaces && workspaces.archivedSessionIds ? workspaces.archivedSessionIds : EMPTY
      const archivedSet = React.useMemo(() => {
        const set = new Set()
        for (let index = 0; index < archived.length; index += 1) set.add(archived[index])
        return set
      }, [archived])

      /** Most recently touched workspace, so the office opens on the desk in use. */
      const active = React.useMemo(() => {
        if (items.length === 0) return null
        if (chosen) {
          for (let index = 0; index < items.length; index += 1) {
            if (items[index].workspaceId === chosen) return items[index]
          }
        }
        let best = items[0]
        let bestAt = -1
        for (let index = 0; index < items.length; index += 1) {
          const workspace = items[index]
          const ids = workspace.sessionIds || EMPTY
          for (let inner = 0; inner < ids.length; inner += 1) {
            const summary = byId[ids[inner]]
            const stamp = summary && typeof summary.updatedAt === 'number' ? summary.updatedAt : 0
            if (stamp > bestAt) {
              bestAt = stamp
              best = workspace
            }
          }
        }
        return best
      }, [items, chosen, byId])

      const activeId = active ? active.workspaceId : null

      /** Direct children of one Session, from the parent's catalog plus listed rows. */
      const childrenOf = React.useCallback((parentId) => {
        const out = []
        const local = new Set()
        const add = (id, entry) => {
          if (!id || local.has(id)) return
          local.add(id)
          out.push({ id: id, entry: entry || null })
        }
        const projection = projections[parentId]
        const catalog = projection && projection.values && projection.values.subagentCatalog
        if (Array.isArray(catalog)) {
          for (let index = 0; index < catalog.length; index += 1) add(catalog[index].id, catalog[index])
        }
        const ids = Object.keys(byId)
        for (let index = 0; index < ids.length; index += 1) {
          const summary = byId[ids[index]]
          if (summary && summary.parentId === parentId) add(summary.id, null)
        }
        return out
      }, [projections, byId])

      /**
       * Every Agent of the workspace: all root Sessions in workspace order, then
       * their children breadth-first, so two main Agents come first.
       */
      const members = React.useMemo(() => {
        const out = []
        if (!active) return out
        const seenIds = new Set()
        const ids = active.sessionIds || EMPTY
        for (let index = 0; index < ids.length; index += 1) {
          const summary = byId[ids[index]]
          if (!summary) continue
          if (summary.parentId || summary.origin === 'subagent') continue
          if (archivedSet.has(summary.id) || seenIds.has(summary.id)) continue
          seenIds.add(summary.id)
          out.push({ id: summary.id, entry: null, parentId: null, summary: summary })
        }
        for (let index = 0; index < out.length; index += 1) {
          const parent = out[index]
          const kids = childrenOf(parent.id)
          for (let child = 0; child < kids.length; child += 1) {
            const id = kids[child].id
            if (seenIds.has(id) || archivedSet.has(id)) continue
            seenIds.add(id)
            out.push({ id: id, entry: kids[child].entry, parentId: parent.id, summary: byId[id] })
          }
        }
        return out
      }, [active, byId, archivedSet, childrenOf])

      /** One descriptor per member Agent. */
      const agents = React.useMemo(() => members.map((member) => {
        const summary = member.summary
        const status = statuses && typeof statuses.get === 'function' ? statuses.get(member.id) : undefined
        const state = stateOf(summary, status, seenBook[member.id],
          selectedId === member.id, newsBook[member.id] === true)
        const palette = paletteOf(member.id)
        const entry = member.entry
        const values = summary && summary.projectionValues
        const storedTitle = (values && typeof values.title === 'string' && values.title)
          || (summary && typeof summary.title === 'string' && summary.title)
          || ''
        const name = storedTitle
          || (summary && summary.displayTitle)
          || (entry && (entry.name || entry.label))
          || String(member.id).slice(0, 8)
        const updatedAt = (summary && summary.updatedAt) || (entry && entry.createdAt) || 0
        return {
          id: member.id,
          parentId: member.parentId,
          summary: summary,
          name: name,
          state: state,
          stateLabel: t('state' + state.charAt(0).toUpperCase() + state.slice(1)),
          palette: palette,
          updatedAt: updatedAt,
          onSelect: () => { setSelectedId(member.id) },
        }
      }), [members, statuses, t, seenBook, newsBook, selectedId])

      // A run that finished since the office last showed it becomes a report to
      // review; opening that chat clears it.
      const runningRef = React.useRef(new Map())
      React.useEffect(() => {
        const previous = runningRef.current
        const next = new Map()
        const fresh = []
        for (let index = 0; index < agents.length; index += 1) {
          const agent = agents[index]
          const status = statuses && typeof statuses.get === 'function' ? statuses.get(agent.id) : undefined
          const running = isRunning(agent.summary, status)
          next.set(agent.id, running)
          if (previous.get(agent.id) === true && !running && !newsBook[agent.id]) fresh.push(agent.id)
        }
        runningRef.current = next
        if (fresh.length === 0) return
        setNewsBook((before) => {
          const book = Object.assign({}, before)
          for (let index = 0; index < fresh.length; index += 1) book[fresh[index]] = true
          return book
        })
      }, [agents, statuses, newsBook])

      /** Roles of this office: agentId -> 'supervisor' | 'secretary'. */
      const officeRoles = React.useMemo(() => {
        const book = (activeId && roleBook[activeId]) || {}
        const out = {}
        if (book && typeof book.supervisor === 'string') out[book.supervisor] = 'supervisor'
        if (book && typeof book.secretary === 'string') out[book.secretary] = 'secretary'
        return out
      }, [roleBook, activeId])

      /** One-line summary bound to each identity (built-in or custom). */
      const identitySummaries = React.useMemo(() => {
        const book = (activeId && roleBook[activeId]) || {}
        const stored = book && book.summaries && typeof book.summaries === 'object' ? book.summaries : {}
        return stored
      }, [roleBook, activeId])

      const summaryOfIdentity = (label) => {
        if (!label) return ''
        const book = (activeId && roleBook[activeId]) || {}
        const registry = book && book.identities && typeof book.identities === 'object' ? book.identities : {}
        if (registry[label] && typeof registry[label].summary === 'string') return registry[label].summary
        if (typeof identitySummaries[label] === 'string') return identitySummaries[label]
        if (label === t('roleSupervisor')) return t('roleSupervisorHint')
        if (label === t('roleSecretary')) return t('roleSecretaryHint')
        return ''
      }

      /** Labels shown on the chair badges: built-in roles or a custom title. */
      const officeLabels = React.useMemo(() => {
        const book = (activeId && roleBook[activeId]) || {}
        const out = {}
        if (book && typeof book.supervisor === 'string') out[book.supervisor] = t('roleSupervisor')
        if (book && typeof book.secretary === 'string') out[book.secretary] = t('roleSecretary')
        const custom = book && book.custom && typeof book.custom === 'object' ? book.custom : {}
        for (const key of Object.keys(custom)) {
          if (typeof custom[key] === 'string' && custom[key] !== '') out[key] = custom[key]
        }
        return out
      }, [roleBook, activeId, t])

      const assignRole = React.useCallback((agentId, role, label) => {
        if (!activeId) return
        setRoleBook((previous) => {
          const book = Object.assign({}, previous[activeId] || {})
          const custom = Object.assign({}, book.custom || {})
          delete custom[agentId]
          if (role === '') {
            if (book.supervisor === agentId) delete book.supervisor
            if (book.secretary === agentId) delete book.secretary
          } else if (role === 'custom') {
            if (book.supervisor === agentId) delete book.supervisor
            if (book.secretary === agentId) delete book.secretary
            const text = String(label || '').trim()
            if (text !== '') {
              custom[agentId] = text.slice(0, 16)
              // Register the identity itself so it stays available after the
              // member moves to another one.
              const registry = Object.assign({}, book.identities || {})
              if (!registry[text]) registry[text] = { summary: '' }
              book.identities = registry
            }
          } else if (book[role] === agentId) delete book[role]
          else {
            const other = role === 'supervisor' ? 'secretary' : 'supervisor'
            if (book[other] === agentId) delete book[other]
            book[role] = agentId
          }
          book.custom = custom
          const next = Object.assign({}, previous)
          next[activeId] = book
          writeRoles(next)
          return next
        })
      }, [activeId])

      React.useEffect(() => {
        if (selectedId === null) return
        let found = false
        for (let index = 0; index < agents.length; index += 1) {
          if (agents[index].id === selectedId) { found = true; break }
        }
        if (!found) setSelectedId(null)
      }, [agents, selectedId])

      /** Delete a custom identity from every member and drop its summary. */
      const removeIdentity = React.useCallback((label) => {
        if (!label || !activeId) return
        setRoleBook((previous) => {
          const book = Object.assign({}, previous[activeId] || {})
          const custom = Object.assign({}, book.custom || {})
          for (const key of Object.keys(custom)) {
            if (custom[key] === label) delete custom[key]
          }
          book.custom = custom
          const summaries = Object.assign({}, book.summaries || {})
          delete summaries[label]
          book.summaries = summaries
          const registry = Object.assign({}, book.identities || {})
          delete registry[label]
          book.identities = registry
          const next = Object.assign({}, previous)
          next[activeId] = book
          writeRoles(next)
          return next
        })
      }, [activeId])

      /** Record that the office has shown this Agent's latest activity. */
      const markSeen = React.useCallback((agentId, stamp) => {
        setNewsBook((previous) => {
          if (previous[agentId] !== true) return previous
          const next = Object.assign({}, previous)
          delete next[agentId]
          return next
        })
        setSeenBook((previous) => {
          const value = typeof stamp === 'number' && stamp > 0 ? stamp : Date.now()
          if (previous[agentId] === value) return previous
          const next = Object.assign({}, previous)
          next[agentId] = value
          writeSeen(next)
          return next
        })
      }, [])

      const openEditor = React.useCallback((seat, mode) => {
        const agent = seat.agent
        const wanted = mode || (agent ? 'name' : 'new')
        setEditor({
          mode: wanted,
          agentId: agent ? agent.id : null,
          seatKey: seat.key,
          agent: agent || null,
          name: agent ? agent.name : '',
          role: agent ? (officeRoles[agent.id] || '') : '',
            label: agent ? (officeLabels[agent.id] || '') : '',
          busy: false,
          error: '',
        })
        setOfficeMenu(false)
      }, [officeRoles, roleBook, personaBook, activeId, t])

      /** Rename a conversation exactly like the shipped UI: through its Session face. */
      const renameAgent = React.useCallback((agentId, title) => new Promise((resolve, reject) => {
        let reference = null
        try {
          reference = sessions.retain(agentId, { source: RETAIN_SOURCE })
        } catch (error) {
          reject(error)
          return
        }
        const close = () => { try { reference.release() } catch (error) { /* released */ } }
        reference.ready.then(() => {
          const binding = reference.binding
          const face = binding && binding.session
          if (!face || typeof face.rename !== 'function') {
            close()
            reject(new Error('rename unavailable'))
            return
          }
          Promise.resolve(face.rename(title)).then((result) => {
            close()
            if (result && result.ok === false) reject(new Error((result.error && result.error.message) || 'rename failed'))
            else resolve(result && result.value ? result.value : null)
          }, (error) => { close(); reject(error) })
        }, (error) => { close(); reject(error) })
      }), [sessions])

      const closeEditor = React.useCallback(() => { setEditor(null) }, [])

      React.useEffect(() => {
        if (editor === null) return undefined
        const onKey = (event) => { if (event.key === 'Escape') setEditor(null) }
        globalThis.addEventListener('keydown', onKey)
        return () => { globalThis.removeEventListener('keydown', onKey) }
      }, [editor])

      const setEditorField = (field, value) => {
        setEditor((previous) => (previous === null ? null : Object.assign({}, previous, { [field]: value, error: '' })))
      }

      const saveEditor = React.useCallback(() => {
        if (editor === null) return
        const finish = (error) => {
          if (error) {
            setEditor((previous) => (previous === null ? null : Object.assign({}, previous, { busy: false, error: error })))
            return
          }
          setEditor(null)
        }
        if (editor.mode === 'role') {
          if (!editor.agentId) { finish(''); return }
          setEditor((previous) => (previous === null ? null : Object.assign({}, previous, { busy: true, error: '' })))
          const custom = String(editor.custom || '').trim()
          if (custom !== '') assignRole(editor.agentId, 'custom', custom)
          else assignRole(editor.agentId, editor.role === 'custom' ? '' : (editor.role || ''))
          if (interviewRef.current) {
            interviewRef.current(editor.agentId, (agentRulesBook[editor.agentId] || EMPTY).join('\n'), {
              label: custom !== '' ? custom : (editor.role === 'supervisor' ? t('roleSupervisor') : (editor.role === 'secretary' ? t('roleSecretary') : '')),
              summary: String(editor.summary || '').trim(),
              persona: String(editor.persona || ''),
            })
          }
          const summaryLabel = custom !== '' ? custom : (editor.role === 'supervisor' ? t('roleSupervisor') : (editor.role === 'secretary' ? t('roleSecretary') : ''))
          if (summaryLabel !== '') {
            setRoleBook((previous) => {
              const book = Object.assign({}, previous[activeId] || {})
              const summaries = Object.assign({}, book.summaries || {})
              summaries[summaryLabel] = String(editor.summary || '').trim()
              book.summaries = summaries
              const registry = Object.assign({}, book.identities || {})
              registry[summaryLabel] = Object.assign({}, registry[summaryLabel] || {}, { summary: summaries[summaryLabel] })
              book.identities = registry
              const next = Object.assign({}, previous)
              next[activeId] = book
              writeRoles(next)
              return next
            })
          }
          const persona = String(editor.persona || '')
          setPersonaBook((previous) => {
            const next = Object.assign({}, previous)
            if (persona.trim() === '') delete next[editor.agentId]
            else next[editor.agentId] = persona
            writePersonas(next)
            return next
          })
          finish('')
          return
        }
        const name = String(editor.name || '').trim()
        if (name === '') {
          setEditor((previous) => (previous === null ? null : Object.assign({}, previous, { error: t('nameRequired') })))
          return
        }
        setEditor((previous) => (previous === null ? null : Object.assign({}, previous, { busy: true, error: '' })))
        if (editor.agentId) {
          const agentId = editor.agentId
          renameAgent(agentId, name).then(() => {
            // A rename is activity; treat the fresh stamp as already shown so the
            // hand does not rise for the title change the user just made.
            const list = sessions && sessions.list
            const snapshot = list && typeof list.getSnapshot === 'function' ? list.getSnapshot() : null
            const entry = snapshot && snapshot.byId ? snapshot.byId[agentId] : null
            if (entry && typeof entry.updatedAt === 'number') markSeen(agentId, entry.updatedAt)
            if (interviewRef.current) interviewRef.current(agentId, (agentRulesBook[agentId] || EMPTY).join('\n'))
            finish('')
          }).catch((error) => finish(String((error && error.message) || error)))
          return
        }
        if (!activeId || typeof sessions.create !== 'function') {
          finish(t('newFailed'))
          return
        }
        Promise.resolve(sessions.create({ workspaceId: activeId })).then((created) => {
          const sessionId = typeof created === 'string' ? created : (created && created.value && created.value.sessionId)
          if (!sessionId) throw new Error(t('newFailed'))
          // Park the new employee on the desk that was clicked.
          const slot = slotIndexOf(editor.seatKey)
          if (slot >= 0) {
            const order = []
            for (let index = 0; index < 10; index += 1) order.push(null)
            for (let index = 0; index < seatPlan.length; index += 1) {
              const seat = seatPlan[index]
              if (!seat.agent) continue
              const seatSlot = seat.def.kind === 'big'
                ? 8 + Number(String(seat.key).replace('b', ''))
                : Number(String(seat.key).replace('s', ''))
              order[seatSlot] = seat.agent.id
            }
            order[slot] = sessionId
            const next = Object.assign({}, seatBook)
            next[activeId] = order
            writeSeatBook(next)
            setSeatBook(next)
          }
          return renameAgent(sessionId, name)
        }).then(() => { finish('') }).catch((error) => finish(String((error && error.message) || error)))
      }, [editor, sessions, activeId, assignRole, markSeen, renameAgent, agentRulesBook, t])

      /** The bookshelf of a desk lists the skills that Agent has actually loaded. */
      const openSkills = React.useCallback((seat) => {
        const agent = seat.agent
        if (!agent) return
        setSkillPanel({ agentId: agent.id, name: agent.name, skills: EMPTY, busy: true, error: '' })
        let reference = null
        try {
          reference = sessions.retain(agent.id, { source: RETAIN_SOURCE })
        } catch (error) {
          setSkillPanel({ agentId: agent.id, name: agent.name, skills: EMPTY, busy: false, error: String((error && error.message) || error) })
          return
        }
        const close = () => { try { reference.release() } catch (error) { /* already released */ } }
        reference.ready.then(() => {
          const binding = reference.binding
          const window = binding && binding.eventSource ? binding.eventSource.getSnapshot() : null
          const entries = window && Array.isArray(window.entries) ? window.entries : EMPTY
          setSkillPanel({ agentId: agent.id, name: agent.name, skills: skillNamesOf(entries), busy: false, error: '' })
          close()
        }, (error) => {
          setSkillPanel({ agentId: agent.id, name: agent.name, skills: EMPTY, busy: false, error: String((error && error.message) || error) })
          close()
        })
      }, [sessions])

      /** The whiteboard holds the office rules that every message from here carries. */
      const officeRules = (activeId && rulesBook[activeId]) || EMPTY
      const openRules = React.useCallback(() => {
        setRulesEditor({ text: (officeRules.length > 0 ? officeRules : [t('rulesExample')]).join('\n'), busy: false, error: '' })
      }, [officeRules, t])
      const saveRules = React.useCallback(() => {
        if (rulesEditor === null || !activeId) return
        const lines = String(rulesEditor.text || '').split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== '')
        const next = Object.assign({}, rulesBook)
        next[activeId] = lines
        writeRules(next)
        setRulesBook(next)
        setRulesEditor(null)
      }, [rulesEditor, rulesBook, activeId])

      const openMug = React.useCallback((seat) => {
        const agent = seat.agent
        if (!agent) return
        const own = agentRulesBook[agent.id] || EMPTY
        setMugEditor({ agentId: agent.id, name: agent.name, text: own.join('\n'), error: '' })
      }, [agentRulesBook])

      const saveMug = React.useCallback(() => {
        if (mugEditor === null) return
        const lines = String(mugEditor.text || '').split('\n')
          .map((line) => line.trim())
          .filter((line) => line !== '')
        const next = Object.assign({}, agentRulesBook)
        if (lines.length > 0) next[mugEditor.agentId] = lines
        else delete next[mugEditor.agentId]
        writeAgentRules(next)
        setAgentRulesBook(next)
        setMugEditor(null)
      }, [mugEditor, agentRulesBook])

      /** Dismiss (archive) one employee, leaving rules and skills on the desk. */
      const dismissAgent = React.useCallback((agentId, seatKey) => {
        if (!agentId || !activeId) return
        const slot = slotIndexOf(seatKey)
        const rules = agentRulesBook[agentId] || EMPTY
        const archive = (skills) => {
          const memory = Object.assign({}, seatMemoryBook[activeId] || {})
          memory[slot] = { rules: rules, skills: skills || EMPTY }
          const nextMemory = Object.assign({}, seatMemoryBook)
          nextMemory[activeId] = memory
          writeSeatMemory(nextMemory)
          setSeatMemoryBook(nextMemory)
          if (typeof props.archiveSession === 'function') {
            Promise.resolve(props.archiveSession(agentId)).catch(() => {})
          }
          setEditor(null)
        }
        let reference = null
        try {
          reference = sessions.retain(agentId, { source: RETAIN_SOURCE })
        } catch (error) {
          reference = null
        }
        if (!reference) { archive(EMPTY); return }
        const close = () => { try { reference.release() } catch (error) { /* released */ } }
        reference.ready.then(() => {
          const binding = reference.binding
          const window = binding && binding.eventSource ? binding.eventSource.getSnapshot() : null
          const entries = window && Array.isArray(window.entries) ? window.entries : EMPTY
          const skills = skillNamesOf(entries)
          close()
          archive(skills)
        }, () => { close(); archive(EMPTY) })
      }, [activeId, agentRulesBook, seatMemoryBook, sessions, props.archiveSession])

      /** Send one memory block now: identity, persona, office rules, personal rules. */
      const interviewAgent = React.useCallback((agentId, personalText, overrides) => {
        if (!agentId) return
        const agent = agents.find((item) => item.id === agentId)
        if (!agent) return
        const next = overrides || {}
        const identity = next.label !== undefined ? String(next.label || '') : (officeLabels[agentId] || '')
        const lines = [t('memoryHeader')]
        lines.push(t('memoryName') + ' ' + agent.name + (identity !== '' && identity !== agent.name ? '（' + identity + '）' : ''))
        const identitySummary = next.summary !== undefined ? String(next.summary || '').trim() : summaryOfIdentity(identity)
        if (identitySummary !== '') lines.push(t('identitySummaryLabel') + ' ' + identitySummary)
        const persona = next.persona !== undefined ? String(next.persona || '').trim() : String(personaBook[agentId] || '').trim()
        if (persona !== '') lines.push(t('personaPrefix') + '\n' + persona)
        if (officeRules.length > 0) lines.push(t('rulesPrefix') + '\n' + officeRules.map((line, i) => (i + 1) + '. ' + line).join('\n'))
        const own = String(personalText || '').split('\n').map((line) => line.trim()).filter((line) => line !== '')
        if (own.length > 0) lines.push(t('agentRulesPrefix') + '\n' + own.map((line, i) => (i + 1) + '. ' + line).join('\n'))
        lines.push(t('memoryAuthoritative'))
        const text = lines.join('\n\n')
        let reference = null
        try {
          reference = sessions.retain(agentId, { source: RETAIN_SOURCE })
        } catch (error) {
          return
        }
        const done = () => { try { reference.release() } catch (error) { /* released */ } }
        reference.ready.then(() => {
          const face = reference.binding && reference.binding.session
          if (!face || typeof face.prompt !== 'function') { done(); return }
          const send = () => { Promise.resolve(face.prompt([{ type: 'text', text: text }], 'queue')).then(done, done) }
          if (face.rename && agent.name) Promise.resolve(face.rename(agent.name)).then(send, send)
          else send()
        }, done)
      }, [agents, officeRules, personaBook, officeLabels, sessions, t])

      interviewRef.current = interviewAgent

      const board = {
        lines: officeRules,
        onOpen: openRules,
      }

      /** The supervisor and secretary take the two large desks; everyone else gets a small one. */
      const seatPlan = React.useMemo(() => {
        const ordered = (activeId && seatBook[activeId]) || EMPTY
        const byId = {}
        for (let index = 0; index < agents.length; index += 1) byId[agents[index].id] = agents[index]
        const slots = []
        const placed = new Set()
        for (let index = 0; index < 10; index += 1) {
          const id = ordered[index]
          const agent = id ? byId[id] : null
          if (agent && !placed.has(agent.id)) {
            slots[index] = agent
            placed.add(agent.id)
          } else {
            slots[index] = null
          }
        }
        // Agents the saved order does not mention: roles get the large desks
        // first, then everyone else in workspace order.
        const rank = (agent) => {
          const role = officeRoles[agent.id]
          return role === 'supervisor' ? 0 : (role === 'secretary' ? 1 : 2)
        }
        const free = []
        for (let index = 0; index < agents.length; index += 1) {
          if (!placed.has(agents[index].id)) free.push(agents[index])
        }
        free.sort((left, right) => rank(left) - rank(right))
        let cursor = 0
        const take = (slot) => {
          if (slots[slot] !== null) return
          while (cursor < free.length && placed.has(free[cursor].id)) cursor += 1
          if (cursor >= free.length) return
          slots[slot] = free[cursor]
          placed.add(free[cursor].id)
          cursor += 1
        }
        take(8)
        take(9)
        for (let index = 0; index < 8; index += 1) take(index)
        const plan = []
        for (let index = 0; index < SMALL_SEATS.length; index += 1) {
          const agent = slots[index] || null
          plan.push({
            key: 's' + index,
            def: SMALL_SEATS[index],
            agent: agent,
            role: agent ? (officeRoles[agent.id] || '') : '',
            label: agent ? (officeLabels[agent.id] || '') : '',
          })
        }
        for (let index = 0; index < BIG_SEATS.length; index += 1) {
          const agent = slots[8 + index] || null
          plan.push({
            key: 'b' + index,
            def: BIG_SEATS[index],
            agent: agent,
            role: agent ? (officeRoles[agent.id] || '') : '',
            label: agent ? (officeLabels[agent.id] || '') : '',
          })
        }
        return plan
      }, [agents, officeRoles, officeLabels, seatBook, activeId])

      /** The seat of one Agent, for the hand-off walk. */
      const resolveSeat = React.useCallback((id) => {
        for (let index = 0; index < seatPlan.length; index += 1) {
          const seat = seatPlan[index]
          if (!seat.agent || seat.agent.id !== id) continue
          return {
            cx: seat.def.personX,
            feetY: seat.def.feetY,
            standX: seat.def.standX,
            standY: seat.def.standY,
            palette: seat.agent.palette,
            name: seat.agent.name,
            spriteW: seat.def.spriteW,
          }
        }
        return null
      }, [seatPlan])

      /** Put one Agent on any desk (large included), swapping whoever sits there. */
      const moveAgentToSeat = React.useCallback((agentId, seatKey) => {
        if (!agentId || !activeId) return
        const order = []
        for (let index = 0; index < 10; index += 1) order.push(null)
        for (let index = 0; index < seatPlan.length; index += 1) {
          const seat = seatPlan[index]
          if (!seat.agent) continue
          const slot = seat.def.kind === 'big'
            ? 8 + Number(String(seat.key).replace('b', ''))
            : Number(String(seat.key).replace('s', ''))
          order[slot] = seat.agent.id
        }
        const target = Number(String(seatKey).replace(/[sb]/, ''))
          + (String(seatKey).charAt(0) === 'b' ? 8 : 0)
        const from = order.indexOf(agentId)
        if (from < 0 || !isFinite(target) || target < 0 || target >= order.length) return
        if (target === from) return
        const occupant = order[target] || null
        order[target] = agentId
        order[from] = occupant
        const next = Object.assign({}, seatBook)
        next[activeId] = order
        writeSeatBook(next)
        setSeatBook(next)
      }, [seatPlan, activeId, seatBook])

      const notice = React.useMemo(() => {
        if (items.length === 0) {
          if (workspaces && workspaces.state === 'loading') {
            return { title: t('loadingTitle'), hint: '', action: null }
          }
          return { title: t('noWorkspaceTitle'), hint: t('noWorkspaceHint'), action: null }
        }
        if (active) {
          const ids = active.sessionIds || EMPTY
          let visible = 0
          for (let index = 0; index < ids.length; index += 1) {
            if (!archivedSet.has(ids[index]) && byId[ids[index]]) visible += 1
          }
          if (visible > 0 && agents.length === 0) {
            return { title: t('loadingTitle'), hint: '', action: null }
          }
        }
        if (agents.length === 0) {
          return {
            title: t('emptyTitle'),
            hint: t('emptyHint'),
            action: active
              ? {
                label: t('newSession'),
                onClick: () => { if (typeof props.startSession === 'function') props.startSession(activeId) },
              }
              : null,
          }
        }
        return null
      }, [items.length, agents.length, active, activeId, archivedSet, byId, t, props.startSession, workspaces])

      const selected = selectedId === null
        ? null
        : (agents.find((agent) => agent.id === selectedId) || null)

      const rosterLine = agents.map((agent) => agent.name + '（' + (officeLabels[agent.id] || t('noneLabel')) + '）').join('、')
      const selectedSeat = selected
        ? seatPlan.find((seat) => seat.agent && seat.agent.id === selected.id)
        : null
      const inherit = selectedSeat && activeId && seatMemoryBook[activeId]
        ? (seatMemoryBook[activeId][slotIndexOf(selectedSeat.key)] || null)
        : null

      // One-time memory sync: identity, persona, office rules, personal rules and
      // the desk's inherited notes are sent once per change, never per message.
      React.useEffect(() => {
        if (!AUTO_MEMORY_SYNC) return
        if (!activeId) return
        const hashes = readMemoryHashes()
        let changed = false
        for (let index = 0; index < agents.length; index += 1) {
          const agent = agents[index]
          const seat = seatPlan.find((entry) => entry.agent && entry.agent.id === agent.id)
          const slot = seat ? slotIndexOf(seat.key) : -1
          const memory = slot >= 0 && seatMemoryBook[activeId] ? seatMemoryBook[activeId][slot] : null
          const own = agentRulesBook[agent.id] || EMPTY
          const lines = [t('memoryHeader')]
          const fallbackName = t('newSeat') + ' ' + (index + 1)
          const remembered = namesRef.current[agent.id]
          const cleanName = (value) => {
            const text = String(value || '')
            if (text === '' || /记忆同步|Memory sync/.test(text)) return remembered || fallbackName
            if (namesRef.current[agent.id] !== text) {
              namesRef.current[agent.id] = text
              writeNames(namesRef.current)
            }
            return text
          }
          const ownName = cleanName(agent.name)
          const ownLabel = officeLabels[agent.id] || ''
          lines.push(t('memoryName') + ' ' + ownName + (ownLabel !== '' && ownLabel !== ownName ? '（' + ownLabel + '）' : ''))
          const identitySummary = summaryOfIdentity(officeLabels[agent.id] || '')
          if (identitySummary !== '') lines.push(t('identitySummaryLabel') + ' ' + identitySummary)
          const persona = String(personaBook[agent.id] || '').trim()
          if (persona !== '') lines.push(t('personaPrefix') + '\n' + persona)
          if (officeRules.length > 0) lines.push(t('rulesPrefix') + '\n' + officeRules.map((line, i) => (i + 1) + '. ' + line).join('\n'))
            if (own.length > 0) lines.push(t('agentRulesPrefix') + '\n' + own.map((line, i) => (i + 1) + '. ' + line).join('\n'))
          else if (memory && Array.isArray(memory.rules) && memory.rules.length > 0) lines.push(t('seatRulesPrefix') + '\n' + memory.rules.map((line, i) => (i + 1) + '. ' + line).join('\n'))
          if (memory && Array.isArray(memory.skills) && memory.skills.length > 0) lines.push(t('seatSkillsPrefix') + ' ' + memory.skills.join(' / '))
          const others = agents.filter((item) => item.id !== agent.id)
          if (others.length > 0) {
            const names = others.map((item) => {
              const label = officeLabels[item.id] || ''
              const name = cleanName(item.name)
              return name + (label !== '' && label !== name ? '（' + label + '）' : '')
            })
            lines.push(t('rosterPrefix') + '\n' + names.join('、'))
          }
          const text = lines.join('\n\n')
          const hash = String(hashOf(text))
          // A title truncating the memory block is repaired by syncing again.
          const brokenTitle = /(\u8bb0\u5fc6\u540c\u6b65|Memory sync)/.test(String(agent.name || ''))
          if (hashes[agent.id] === hash && !brokenTitle) continue
          hashes[agent.id] = hash
          changed = true
          let reference = null
          try {
            reference = sessions.retain(agent.id, { source: RETAIN_SOURCE })
          } catch (error) {
            continue
          }
          const done = () => { try { reference.release() } catch (error) { /* released */ } }
          reference.ready.then(() => {
            const face = reference.binding && reference.binding.session
            if (!face || typeof face.prompt !== 'function') { done(); return }
            // Sending the memory block would let the Host auto-title the Session
            // from it, so pin the intended title right afterwards.
            const raw = String(agent.name || '')
            const nasty = /^(\u3010\u50cf\u7d20\u529e\u516c\u5ba4\u8bb0\u5fc6\u540c\u6b65|\[Memory sync)/.test(raw)
            const title = nasty ? (namesRef.current[agent.id] || t('newSeat') + ' ' + (index + 1)) : raw
            const send = () => {
              Promise.resolve(face.prompt([{ type: 'text', text: text }], 'queue')).then(done, done)
            }
            if (face.rename && title) Promise.resolve(face.rename(title)).then(send, send)
            else send()
          }, done)
        }
        if (changed) writeMemoryHashes(hashes)
      }, [agents, seatPlan, officeRules, agentRulesBook, personaBook, seatMemoryBook, officeLabels, rosterLine, activeId, sessions, t])

      const scene = {
        seats: seatPlan,
        notice: notice,
        selectedId: selectedId || '',
        onOpenEditor: openEditor,
        onOpenSkills: openSkills,
        onOpenMug: openMug,
        board: board,
        onDropAgent: moveAgentToSeat,
        quip: quip,
        cat: cat,
        dog: dog,
        petSay: petSay,
        stroll: stroll,
      }

      /** The supervisor identity ranks above everyone; the secretary ranks above staff. */
      const isSuperior = (agent) => {
        const label = officeLabels[agent.id] || ''
        return label === t('roleSupervisor') || label === t('roleSecretary')
      }

      /** Prompt one Agent through its own Session face. */
      const promptAgent = React.useCallback((agentId, text) => {
        if (!agentId || !text) return
        let reference = null
        try {
          reference = sessions.retain(agentId, { source: RETAIN_SOURCE })
        } catch (error) {
          return
        }
        const done = () => { try { reference.release() } catch (error) { /* released */ } }
        reference.ready.then(() => {
          const face = reference.binding && reference.binding.session
          if (!face || typeof face.prompt !== 'function') { done(); return }
          Promise.resolve(face.prompt([{ type: 'text', text: text }], 'queue')).then(done, done)
        }, done)
      }, [sessions])

      /** Read the last completed reply of one Agent. */
      const lastReply = React.useCallback((agentId) => new Promise((resolve) => {
        let reference = null
        try {
          reference = sessions.retain(agentId, { source: RETAIN_SOURCE })
        } catch (error) {
          resolve('')
          return
        }
        const done = () => { try { reference.release() } catch (error) { /* released */ } }
        reference.ready.then(() => {
          const binding = reference.binding
          const window = binding && binding.eventSource ? binding.eventSource.getSnapshot() : null
          const entries = window && Array.isArray(window.entries) ? window.entries : EMPTY
          let text = ''
          for (let index = entries.length - 1; index >= 0; index -= 1) {
            const event = entries[index] && entries[index].event
            if (!event || event.type !== 'assistant/message') continue
            const parts = blocksOf(event.data && event.data.message, true)
            text = parts.text
            break
          }
          done()
          resolve(text)
        }, () => { done(); resolve('') })
      }), [sessions])

      // When a run finishes: a delegatee reports to its superior, a superior's
      // own reply may carry a dispatch line for a subordinate.
      React.useEffect(() => {
        const previous = handledRef.current
        for (let index = 0; index < agents.length; index += 1) {
          const agent = agents[index]
          const status = statuses && typeof statuses.get === 'function' ? statuses.get(agent.id) : undefined
          const running = isRunning(agent.summary, status)
          const stamp = agent.updatedAt || 0
          if (running || stamp === 0 || previous[agent.id] === stamp) continue
          // Only superiors and Agents holding a delegated job are inspected; every
          // other finished run is left alone, which keeps the retain traffic down.
          if (!delegatedRef.current[agent.id] && !isSuperior(agent)) { previous[agent.id] = stamp; continue }
          previous[agent.id] = stamp
          lastReply(agent.id).then((text) => {
            if (text === '') return
            const job = delegatedRef.current[agent.id]
            if (job) {
              delete delegatedRef.current[agent.id]
              const reportTo = job.from
              if (reportTo) promptAgent(reportTo, t('reportPrefix') + ' ' + agent.name + ']\n' + text)
              return
            }
            if (!isSuperior(agent)) return
            const dispatch = parseDispatch(text)
            if (!dispatch) return
            const target = agents.find((item) => item.id !== agent.id
              && (item.name === dispatch.target || (officeLabels[item.id] || '') === dispatch.target))
            if (!target) return
            delegatedRef.current[target.id] = { from: agent.id, task: dispatch.task }
            promptAgent(target.id, t('dispatchPrefix') + ' ' + agent.name + t('dispatchTail') + '\n' + dispatch.task)
          })
        }
      }, [agents, statuses, lastReply, promptAgent, officeLabels, t])

      // Every so often an employee with working sub-agents teases about the
      // outsourcing. Display only: nothing enters the conversation.
      React.useEffect(() => {
        const timer = window.setInterval(() => {
          const busy = []
          for (let index = 0; index < agents.length; index += 1) {
            const agent = agents[index]
            const kids = childrenOf(agent.id)
            for (let inner = 0; inner < kids.length; inner += 1) {
              const status = statuses && typeof statuses.get === 'function' ? statuses.get(kids[inner].id) : undefined
              if (status && status.running) { busy.push(agent); break }
            }
          }
          if (busy.length === 0) return
          const agent = busy[Math.floor(Math.random() * busy.length)]
          const tone = quipTone(personaBook[agent.id])
          const pool = QUIPS[tone]
          setQuip({
            agentId: agent.id,
            text: pool[Math.floor(Math.random() * pool.length)],
            until: Date.now() + 6000,
          })
        }, 18000)
        return () => window.clearInterval(timer)
      }, [agents, childrenOf, statuses, personaBook])

      // Retire an expired quip.
      React.useEffect(() => {
        if (quip === null) return undefined
        const timer = window.setTimeout(() => setQuip(null), 6000)
        return () => window.clearTimeout(timer)
      }, [quip])

      // Idle staff get up now and then: a short walk, a stretch, a pat for the
      // cat. The sprite (and its click target) travels with them.
      React.useEffect(() => {
        const timer = window.setInterval(() => {
          if (document.hidden || !hoveredRef.current) return
          if (stroll !== null) return
          const idle = agents.filter((agent) => agent.state === 'idle')
          if (idle.length === 0) return
          const agent = idle[Math.floor(Math.random() * idle.length)]
          const spots = [
            { x: 70, y: 96, text: '（起身走了两步）' },
            { x: 200, y: 120, text: '（活动了一下脖子）' },
            { x: 300, y: 150, text: '（去接了杯水）' },
            { x: 61, y: 80, text: '（摸了摸猫）' },
            { x: 40, y: 84, text: '（逗了一下狗）' },
            { x: 250, y: 200, text: '（伸了个懒腰）' },
          ]
          const spot = spots[Math.floor(Math.random() * spots.length)]
          setStroll({ agentId: agent.id, x: spot.x, y: spot.y, facing: Math.random() < 0.5 ? -1 : 1 })
          setQuip({ agentId: agent.id, text: spot.text, until: Date.now() + 5000 })
        }, 56000)
        return () => window.clearInterval(timer)
      }, [agents, stroll])

      React.useEffect(() => {
        if (stroll === null) return undefined
        const timer = window.setTimeout(() => setStroll(null), 12000)
        return () => window.clearTimeout(timer)
      }, [stroll])

      // The pets live their own life: the cat dozes on the tower or a desk, the
      // dog patrols and eats; neither is part of the conversation.
      React.useEffect(() => {
        // Mostly dozing on the tower or a desk; occasionally a stroll.
        const spots = [
          { x: 72, y: 42, pose: 'sleep' },
          { x: 72, y: 57, pose: 'sit' },
          { x: 72, y: 71, pose: 'stretch' },
          { x: 61, y: 74, pose: 'stretch' },
          { x: 150, y: 200, pose: 'walk' },
          { x: 230, y: 218, pose: 'walk' },
          { x: 61, y: 42, pose: 'sleep' },
        ]
        const lines = ['喵——', '呼噜呼噜', '（伸了个懒腰）', '（蹭了蹭桌腿）', '（盯着窗外的鸟）']
        const timer = window.setInterval(() => {
          if (document.hidden || !hoveredRef.current) return
          setCat((previous) => {
            const spot = spots[Math.floor(Math.random() * spots.length)]
            setPetSay({ kind: 'cat', text: lines[Math.floor(Math.random() * lines.length)] })
            return { x: spot.x, y: spot.y, pose: spot.pose, facing: spot.x < previous.x ? -1 : 1 }
          })
        }, 52000)
        return () => window.clearInterval(timer)
      }, [])

      React.useEffect(() => {
        // Naps on its bed, eats, ids around the room, occasionally barks.
        const spots = [
          { x: 38, y: 68, pose: 'sit' },
          { x: 26, y: 78, pose: 'eat' },
          { x: 120, y: 150, pose: 'walk' },
          { x: 210, y: 200, pose: 'walk' },
          { x: 300, y: 218, pose: 'walk' },
          { x: 160, y: 236, pose: 'walk' },
          { x: 250, y: 120, pose: 'bark' },
          { x: 122, y: 70, pose: 'sit' },
        ]
        const lines = ['汪！', '汪？', '（尾巴摇成螺旋桨）', '（叼着球过来）', '（闻到狗粮的味道）']
        const timer = window.setInterval(() => {
          if (document.hidden || !hoveredRef.current) return
          setDog((previous) => {
            const spot = spots[Math.floor(Math.random() * spots.length)]
            setPetSay({ kind: 'dog', text: lines[Math.floor(Math.random() * lines.length)] })
            return { x: spot.x, y: spot.y, pose: spot.pose, facing: spot.x < previous.x ? -1 : 1 }
          })
        }, 40000)
        return () => window.clearInterval(timer)
      }, [])

      React.useEffect(() => {
        if (petSay === null) return undefined
        const timer = window.setTimeout(() => setPetSay(null), 4200)
        return () => window.clearTimeout(timer)
      }, [petSay])

      // Idle staff occasionally chat among themselves or about the pets.
      React.useEffect(() => {
        const timer = window.setInterval(() => {
          if (document.hidden || !hoveredRef.current) return
          const idle = agents.filter((agent) => agent.state === 'idle')
          if (idle.length === 0) return
          const agent = idle[Math.floor(Math.random() * idle.length)]
          const lines = [
            '这猫又在键盘上睡着了。',
            '狗又去翻狗粮了，谁喂的？',
            '有人要一起冲杯咖啡吗？',
            '歇一会儿，脖子有点僵。',
            '今天活儿还算顺。',
            '这狗毛掉我键盘里了。',
            '窗户那边光线不错，晒会儿。',
            '猫爬架又被它占了。',
            '中午吃啥？我投票面。',
            '刚才那个任务谁帮我盯一下？',
          ]
          setQuip({ agentId: agent.id, text: lines[Math.floor(Math.random() * lines.length)], until: Date.now() + 5000 })
        }, 60000)
        return () => window.clearInterval(timer)
      }, [agents])

      const countOf = (workspace) => {
        const ids = workspace.sessionIds || EMPTY
        let count = 0
        for (let index = 0; index < ids.length; index += 1) {
          if (archivedSet.has(ids[index])) continue
          if (!byId[ids[index]]) continue
          count += 1
        }
        return count
      }

      const offices = items.length > 0
        ? h('div', { className: 'po-offices' },
          h('button', {
            type: 'button',
            className: 'po-officeBtn',
            'aria-expanded': officeMenu ? 'true' : 'false',
            'aria-label': t('officeLabel'),
            onClick: () => { setOfficeMenu((open) => !open) },
          },
          h('span', { className: 'po-officeName' }, active ? (active.title || active.path) : t('officeLabel')),
          h('span', { className: 'po-officeCaret' }, officeMenu ? '▴' : '▾')),
          officeMenu
            ? h('div', { className: 'po-officeList', role: 'listbox', 'aria-label': t('officeLabel') },
              items.map((workspace) => h('button', {
                key: workspace.workspaceId,
                type: 'button',
                role: 'option',
                'aria-selected': workspace.workspaceId === activeId,
                'data-active': workspace.workspaceId === activeId ? '1' : '0',
                className: 'po-officeItem',
                onClick: () => {
                  setChosen(workspace.workspaceId)
                  setOfficeMenu(false)
                  setSelectedId(null)
                },
              },
              h('span', { className: 'po-officeItemName' }, workspace.title || workspace.path),
              h('span', { className: 'po-officeItemCount' }, String(countOf(workspace))))))
            : null)
        : null

      const avatarBar = selected
        ? h('div', { className: 'po-avatarBar', role: 'tablist', 'aria-label': t('officeLabel') },
          agents.slice().sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0)).map((agent) => h('button', {
            key: agent.id,
            type: 'button',
            role: 'tab',
            className: 'po-avatarItem',
            'data-active': agent.id === selected.id ? '1' : '0',
            'aria-selected': agent.id === selected.id,
            'aria-label': agent.name,
            onClick: () => { setSelectedId(agent.id) },
          },
          h('span', { className: 'po-avatarFace' }, h(Avatar, { palette: agent.palette })),
          h('i', { className: 'po-avatarDot ' + ('po-dot-' + agent.state) }))))
        : null

      const modal = selected
        ? h('div', {
          className: 'po-modal',
          onClick: (event) => { if (event.target === event.currentTarget) setSelectedId(null) },
        },
        h('div', {
          className: 'po-modalCard',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': selected.name,
        },
        avatarBar,
        h(ChatPanel, {
          agent: selected,
          sessions: sessions,
          t: t,
          role: officeRoles[selected.id] || '',
          rules: officeRules,
          ownRules: agentRulesBook[selected.id] || EMPTY,

          imageUrlOf: props.imageUrlOf,
          uploadFile: props.uploadFile,
          onSeen: markSeen,
          onClose: () => { setSelectedId(null) },
          onOpenFull: (id) => { if (typeof props.openAgent === 'function') props.openAgent(id) },
        })))
        : null

      // Identities available here: the two built-ins plus every custom title
      // already given to someone in this office.
      const customIdentities = React.useMemo(() => {
        const book = (activeId && roleBook[activeId]) || {}
        const custom = book && book.custom && typeof book.custom === 'object' ? book.custom : {}
        const out = []
        const registry = book && book.identities && typeof book.identities === 'object' ? book.identities : {}
        for (const key of Object.keys(registry)) {
          if (typeof key === 'string' && key !== '' && out.indexOf(key) < 0) out.push(key)
        }
        for (const key of Object.keys(custom)) {
          const label = custom[key]
          if (typeof label === 'string' && label !== '' && out.indexOf(label) < 0) out.push(label)
        }
        return out
      }, [roleBook, activeId])

      const identityCards = [
        { value: 'supervisor', title: t('roleSupervisor'), hint: t('roleSupervisorHint') },
        { value: 'secretary', title: t('roleSecretary'), hint: t('roleSecretaryHint') },
      ].concat(customIdentities.map((label) => ({ value: 'custom:' + label, title: label, hint: t('roleCustomHint') })))

      const roleSelected = editor === null
        ? ''
        : (String(editor.custom || '').trim() !== '' ? 'custom:' + editor.custom : (editor.role || ''))

      const pickIdentity = (value) => {
        // Clicking the active identity again removes it from this employee.
        if (roleSelected === value) {
          setEditorField('custom', '')
          setEditorField('role', '')
          return
        }
        if (value.indexOf('custom:') === 0) {
          setEditorField('custom', value.slice('custom:'.length))
          setEditorField('role', 'custom')
          return
        }
        setEditorField('custom', '')
        setEditorField('role', value)
      }

      const editorDialog = editor === null
        ? null
        : h('div', {
          className: 'po-modal po-editorBackdrop',
          onClick: (event) => { if (event.target === event.currentTarget) closeEditor() },
        },
        editor.mode === 'role'
          ? h('div', { className: 'po-editor po-roleDialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('roleLabel') },
            h('div', { className: 'po-roleHead' },
              h('span', { className: 'po-roleFace' }, editor.agent ? h(Avatar, { palette: editor.agent.palette }) : null),
              h('span', { className: 'po-roleTitle' },
                h('span', { className: 'po-roleName' }, editor.agent ? editor.agent.name : ''),
                h('span', { className: 'po-roleSub' }, t('roleDialogHint')))),
            h('span', { className: 'po-editorLabel' }, t('roleLabel')),
            h('div', { className: 'po-roleGrid' },
              identityCards.map((card) => h('button', {
                key: card.value,
                type: 'button',
                className: 'po-roleCard',
                'data-role': card.value,
                style: roleSelected === card.value && card.value.indexOf('custom:') === 0 ? { borderColor: identityColor(card.title) } : null,
                'data-active': roleSelected === card.value ? '1' : '0',
                onClick: () => { pickIdentity(card.value) },
              },
              h('span', { className: 'po-roleCardTitle' }, card.title),
              h('span', { className: 'po-roleCardHint' }, card.hint)))),
            h('div', { className: 'po-roleCustom' },
              h('input', {
                className: 'po-editorInput',
                value: editor.custom || '',
                placeholder: t('roleCustomPlaceholder'),
                onChange: (event) => { setEditorField('custom', event.target.value) },
                onKeyDown: (event) => {
                  if (event.key === 'Enter') { event.preventDefault(); saveEditor() }
                },
              }),
              h('button', {
                type: 'button',
                className: 'po-roleAddBtn',
                onClick: () => {
                  const text = String(editor.custom || '').trim()
                  if (text === '') { setEditorField('error', t('nameRequired')); return }
                  assignRole(editor.agentId, 'custom', text)
                  closeEditor()
                },
              }, t('roleAdd')),
              h('button', {
                type: 'button',
                className: 'po-roleAddBtn',
                title: t('roleRename'),
                'aria-label': t('roleRename'),
                onClick: () => {
                  if (roleSelected.indexOf('custom:') !== 0) { setEditorField('error', t('rolePickCustom')); return }
                  const text = String(editor.custom || '').trim()
                  if (text === '') { setEditorField('error', t('nameRequired')); return }
                  assignRole(editor.agentId, 'custom', text)
                  closeEditor()
                },
              }, t('roleRename'))),
            roleSelected.indexOf('custom:') === 0 ? h('button', {
              type: 'button',
              className: 'po-roleDelete',
              onClick: () => {
                const label = roleSelected.slice('custom:'.length)
                removeIdentity(label)
                closeEditor()
              },
            }, t('roleDelete')) : null,
            h('span', { className: 'po-editorLabel' }, t('identitySummaryLabel')),
            h('input', {
              className: 'po-editorInput',
              value: editor.summary || '',
              placeholder: t('identitySummaryPlaceholder'),
              onChange: (event) => { setEditorField('summary', event.target.value) },
            }),
            h('span', { className: 'po-editorLabel' }, t('personaLabel')),
            h('textarea', {
              className: 'po-editorInput po-rulesArea',
              rows: 5,
              value: editor.persona || '',
              placeholder: t('personaPlaceholder'),
              onChange: (event) => { setEditorField('persona', event.target.value) },
            }),
            editor.error ? h('p', { className: 'po-editorError' }, editor.error) : null,
            editor.agentId ? h('div', { className: 'po-roleDanger' },
              editor.confirmDismiss
                ? h('span', { className: 'po-roleDangerRow' },
                  h('span', null, t('dismissConfirm')),
                  h('button', {
                    type: 'button',
                    className: 'po-dangerBtn',
                    onClick: () => { dismissAgent(editor.agentId, editor.seatKey) },
                  }, t('dismissYes')),
                  h('button', {
                    type: 'button',
                    className: 'po-btn',
                    onClick: () => { setEditorField('confirmDismiss', false) },
                  }, t('cancel')))
                : h('button', {
                  type: 'button',
                  className: 'po-dangerBtn',
                  onClick: () => { setEditorField('confirmDismiss', true) },
                }, t('dismiss')))
              : null,
            h('div', { className: 'po-editorActions' },
              h('button', { type: 'button', className: 'po-btn', onClick: closeEditor }, t('cancel')),
              h('button', { type: 'button', className: 'po-btn po-btnPrimary', onClick: saveEditor }, t('save'))))
          : h('div', { className: 'po-editor', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('rename') },
            h('h2', { className: 'po-editorTitle' }, editor.mode === 'new' ? t('newSeat') : t('rename')),
            h('label', { className: 'po-editorLabel' }, t('nameLabel')),
            h('input', {
              className: 'po-editorInput',
              value: editor.name,
              autoFocus: true,
              placeholder: t('namePlaceholder'),
              onChange: (event) => { setEditorField('name', event.target.value) },
              onKeyDown: (event) => {
                if (event.key === 'Enter') { event.preventDefault(); saveEditor() }
                if (event.key === 'Escape') { event.preventDefault(); closeEditor() }
              },
            }),
            editor.error ? h('p', { className: 'po-editorError' }, editor.error) : null,
            h('div', { className: 'po-editorActions' },
              h('button', { type: 'button', className: 'po-btn', onClick: closeEditor }, t('cancel')),
              h('button', {
                type: 'button',
                className: 'po-btn po-btnPrimary',
                disabled: editor.busy,
                onClick: saveEditor,
              }, editor.mode === 'new' ? t('create') : t('save')))))

      const skillsDialog = skillPanel === null
        ? null
        : h('div', {
          className: 'po-modal po-editorBackdrop',
          onClick: (event) => { if (event.target === event.currentTarget) setSkillPanel(null) },
        },
        h('div', { className: 'po-editor po-skills', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('skills') },
          h('h2', { className: 'po-editorTitle' }, t('skills') + ' · ' + skillPanel.name),
          skillPanel.busy
            ? h('p', { className: 'po-editorLabel' }, t('loadingSkills'))
            : skillPanel.error !== ''
              ? h('p', { className: 'po-editorError' }, skillPanel.error)
              : skillPanel.skills.length === 0
                ? h('p', { className: 'po-editorLabel' }, t('noSkills'))
                : h('ul', { className: 'po-skillList' },
                  skillPanel.skills.map((skill) => h('li', { key: skill, className: 'po-skillItem' }, skill))),
          h('div', { className: 'po-editorActions' },
            h('button', { type: 'button', className: 'po-btn', onClick: () => { setSkillPanel(null) } }, t('close')))))

      const rulesDialog = rulesEditor === null
        ? null
        : h('div', {
          className: 'po-modal po-editorBackdrop',
          onClick: (event) => { if (event.target === event.currentTarget) setRulesEditor(null) },
        },
        h('div', { className: 'po-editor po-rules', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('rules') },
          h('h2', { className: 'po-editorTitle' }, t('rules')),
          h('p', { className: 'po-editorLabel' }, t('rulesHint')),
          h('textarea', {
            className: 'po-editorInput po-rulesArea',
            value: rulesEditor.text,
            rows: 8,
            autoFocus: true,
            onChange: (event) => { setRulesEditor({ text: event.target.value, busy: false, error: '' }) },
          }),
          h('div', { className: 'po-editorActions' },
            h('button', { type: 'button', className: 'po-btn', onClick: () => { setRulesEditor(null) } }, t('cancel')),
            h('button', { type: 'button', className: 'po-btn po-btnPrimary', onClick: saveRules }, t('save')))))

      const mugDialog = mugEditor === null
        ? null
        : h('div', {
          className: 'po-modal po-editorBackdrop',
          onClick: (event) => { if (event.target === event.currentTarget) setMugEditor(null) },
        },
        h('div', { className: 'po-editor po-rules', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('agentRules') },
          h('h2', { className: 'po-editorTitle' }, t('agentRules') + ' · ' + mugEditor.name),
          h('p', { className: 'po-editorLabel' }, t('agentRulesHint')),
          h('textarea', {
            className: 'po-editorInput po-rulesArea',
            value: mugEditor.text,
            rows: 7,
            autoFocus: true,
            onChange: (event) => { setMugEditor({ agentId: mugEditor.agentId, name: mugEditor.name, text: event.target.value, error: '' }) },
          }),
          h('div', { className: 'po-editorActions po-editorSplit' },
            h('button', {
              type: 'button',
              className: 'po-btn',
              onClick: () => {
                const text = mugEditor.text
                saveMug()
                interviewAgent(mugEditor.agentId, text)
              },
            }, t('interview')),
            h('span', { className: 'po-editorGap' }),
            h('button', { type: 'button', className: 'po-btn', onClick: () => { setMugEditor(null) } }, t('cancel')),
            h('button', { type: 'button', className: 'po-btn po-btnPrimary', onClick: saveMug }, t('save')))))

      const body = h('div', {
        className: 'po-body',
        onClick: () => { if (officeMenu) setOfficeMenu(false) },
      },
      h('div', { className: 'po-sceneCol', ref: sceneRef },
        h(Stage, { scene: scene, t: t, size: stageSize })))

      return h('section', { className: 'po-page' }, offices, body, editorDialog, skillsDialog, rulesDialog, mugDialog, modal)
    }

    /** Page shell: styles, error containment, body. */
    function OfficePage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => key
      return h(React.Fragment, null,
        h('style', { key: 'style' }, CSS),
        h(Boundary, {
          key: 'boundary',
          t: t,
          onBack: () => { if (typeof props.backToChat === 'function') props.backToChat() },
        }, h(OfficeView, props)))
    }

    // --------------------------------------------------------------------- style

    const CSS = [
      '.po-page{position:relative;display:flex;flex-direction:column;box-sizing:border-box;height:100%;min-height:0;',
      'padding:0;color:var(--dsw-alias-label-primary);font-size:13px;background:#1b2136;}',
      '.po-page *{box-sizing:border-box;}',
      '.po-dot-working{background:var(--dsw-alias-brand-primary);}',
      '.po-dot-waiting{background:var(--dsw-alias-state-warn-primary);}',
      '.po-dot-done{background:var(--dsw-alias-state-success-primary);}',
      '.po-dot-idle{background:var(--dsw-alias-state-idle-primary);}',
      '.po-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 12px;',
      'border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:transparent;',
      'color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:1;cursor:pointer;}',
      '.po-btn:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.po-btn:disabled{opacity:.5;cursor:default;}',
      '.po-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.po-roleSmall{font-size:0.56cqw;padding:0 5px;border-radius:4px;line-height:1.35;}',
      '.po-roleDialog{width:min(420px,100%);gap:12px;}',
      '.po-roleHead{display:flex;align-items:center;gap:10px;}',
      '.po-roleFace{width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;',
      'border-radius:10px;background:var(--dsw-alias-bg-layer-2);}',
      '.po-roleFace svg{width:32px;height:32px;}',
      '.po-roleTitle{display:flex;flex-direction:column;gap:2px;min-width:0;}',
      '.po-roleName{font-size:13px;line-height:18px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.po-roleSub{font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);}',
      '.po-roleGrid{display:flex;flex-direction:column;gap:6px;}',
      '.po-roleCard{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:9px;',
      'border:1px solid var(--dsw-alias-border-l2);background:transparent;color:inherit;font:inherit;',
      'text-align:left;cursor:pointer;}',
      '.po-roleCard:hover{background:rgba(255,255,255,.06);background:var(--dsw-alias-bg-layer-2);}',
      '.po-roleCard[data-active="1"]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);}',
      '.po-roleCard[data-role="supervisor"][data-active="1"]{border-color:#e8b84a;background:rgba(232,184,74,.16);}',
      '.po-roleCard[data-role="secretary"][data-active="1"]{border-color:#48b0c9;background:rgba(72,176,201,.16);}',
      '.po-roleCardTitle{font-size:12px;line-height:17px;font-weight:600;}',
      '.po-roleCardHint{font-size:10px;line-height:14px;color:var(--dsw-alias-label-secondary);}',
      '.po-roleCustom{display:flex;gap:6px;align-items:center;}',
      '.po-roleCustom .po-editorInput{flex:1 1 auto;min-width:0;}',
      '.po-roleAddBtn{flex:none;height:32px;padding:0 10px;border-radius:8px;',
      'border:1px solid var(--dsw-alias-border-l2);background:transparent;color:inherit;',
      'font:inherit;font-size:12px;cursor:pointer;}',
      '.po-roleAddBtn:hover{background:var(--dsw-alias-bg-layer-2);}',
      '.po-roleDelete{align-self:flex-start;margin-top:2px;padding:0;border:0;background:transparent;',
      'color:#e05a5a;font:inherit;font-size:11px;line-height:16px;cursor:pointer;text-decoration:underline;}',
      '.po-roleDanger{margin-top:2px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1);',
      'display:flex;justify-content:flex-start;}',
      '.po-roleDangerRow{display:flex;align-items:center;gap:6px;font-size:11px;line-height:16px;',
      'color:var(--dsw-alias-label-secondary);flex-wrap:wrap;}',
      '.po-dangerBtn{height:28px;padding:0 10px;border-radius:8px;border:1px solid rgba(224,90,90,.5);',
      'background:transparent;color:#e05a5a;font:inherit;font-size:12px;cursor:pointer;}',
      '.po-dangerBtn:hover{background:rgba(224,90,90,.14);}',
      '.po-skills{width:min(380px,100%);}',
      '.po-skillList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:260px;overflow:auto;}',
      '.po-skillItem{padding:5px 8px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);font-size:12px;line-height:16px;}',
      '.po-rules{width:min(460px,100%);}',
      '.po-rulesArea{min-height:140px;padding:8px;resize:vertical;line-height:18px;font-size:12px;}',
      '.po-btnPrimary{background:var(--dsw-alias-brand-primary);border-color:transparent;',
      'color:#10141c;font-weight:600;}',
      '@keyframes po-typing{0%,100%{transform:translateY(0);}50%{transform:translateY(0.9px);}}',
      '@keyframes po-quipIn{0%{opacity:0;transform:translate(-50%,-90%);}100%{opacity:1;transform:translate(-50%,-100%);}}',
      '.po-title{margin:0;font-size:20px;font-weight:500;line-height:28px;}',
      '.po-sub{margin:2px 0 0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);}',
      '.po-body{flex:1 1 auto;min-height:0;display:flex;min-width:0;}',
      '.po-sceneCol{flex:1 1 auto;min-width:0;min-height:0;display:flex;align-items:center;',
      'justify-content:center;overflow:hidden;container-type:size;}',
      '.po-stage{position:relative;flex:none;width:100%;width:min(100cqw,calc(100cqh * 1.692308));',
      'aspect-ratio:440/260;overflow:hidden;background:#232a44;}',
      '.po-scene{position:absolute;inset:0;width:100%;height:100%;display:block;}',
      '.po-pets{position:absolute;inset:0;pointer-events:none;}',
      '.po-pet{position:absolute;width:3.2%;transform:translate(-50%,-100%);pointer-events:none;',
      'transition:left 4.2s steps(20,end),top 3s steps(14,end);}',
      '.po-stroller{position:absolute;z-index:2;transform:translate(-50%,-100%);width:4.2%;padding:0;',
      'border:0;background:transparent;cursor:pointer;pointer-events:auto;',
      'transition:left 5s steps(24,end),top 3.6s steps(18,end);}',
      '.po-stroller:hover{filter:brightness(1.12);}',
      '.po-petSvg{display:block;width:100%;height:auto;filter:drop-shadow(0 1px 0 rgba(0,0,0,.25));}',
      '.po-petSay{position:absolute;z-index:9;transform:translate(-50%,-100%);max-width:14%;padding:2px 6px;',
      'border-radius:8px;border:2px solid #2b2a33;background:#f7f3e8;color:#2b2a33;font:inherit;',
      'font-size:0.45cqw;line-height:1.3;white-space:nowrap;pointer-events:none;',
      'box-shadow:0 1px 0 rgba(0,0,0,.3);animation:po-quipIn .22s ease-out;}',
      '.po-petSay::after{content:"";position:absolute;left:50%;bottom:-5px;width:7px;height:7px;margin-left:-3px;',
      'background:#f7f3e8;border-right:2px solid #2b2a33;border-bottom:2px solid #2b2a33;transform:rotate(45deg);}',
      '.po-layer{position:absolute;inset:0;pointer-events:none;}',
      '.po-dropZone{position:absolute;pointer-events:auto;border-radius:6px;}',
      '.po-spriteBtn{position:absolute;z-index:2;transform:translate(-50%,-100%);padding:0;border:0;',
      'background:transparent;cursor:grab;pointer-events:auto;border-radius:6px;}',
      '.po-spriteBtn:active{cursor:grabbing;}',
      '.po-spriteBtn:hover{filter:brightness(1.12) saturate(1.05);}',
      '.po-spriteBtn{overflow:visible;}',
      '.po-spriteSvg{display:block;width:100%;height:auto;filter:drop-shadow(0 2px 0 rgba(0,0,0,.22));}',
      '.po-spriteBtn[data-state="working"] .po-workBody{animation:po-typing .5s steps(2,end) infinite;}',
      '.po-spriteBtn[data-state="working"] .po-armDesk{animation:po-typing .5s steps(2,end) infinite;}',
      '.po-shelfBtn{position:absolute;z-index:3;padding:0;border:0;background:transparent;cursor:pointer;',
      'border-radius:3px;pointer-events:auto;}',
      '.po-shelfBtn:hover{background:rgba(255,235,180,.18);box-shadow:0 0 0 1px rgba(255,235,180,.5) inset;}',
      '.po-mugBtn{position:absolute;z-index:3;padding:0;border:0;background:transparent;cursor:pointer;',
      'border-radius:3px;pointer-events:auto;}',
      '.po-mugBtn:hover{background:rgba(224,90,90,.25);box-shadow:0 0 0 1px rgba(224,90,90,.8) inset;}',
      '.po-boardBtn{position:absolute;left:32.7%;top:1.5%;width:20.9%;height:11.5%;z-index:2;',
      'display:flex;flex-direction:column;gap:2px;padding:1.2% 1.4%;border:0;border-radius:2px;',
      'background:transparent;color:#2a2c33;font:inherit;text-align:left;cursor:pointer;overflow:hidden;}',
      '.po-boardBtn:hover{background:rgba(255,255,255,.35);box-shadow:0 0 0 1px rgba(40,44,54,.45) inset;}',
      '.po-boardTitle{font-size:0.62cqw;font-weight:700;letter-spacing:.08em;color:#5b5f6a;flex:none;}',
      '.po-boardLine{font-size:0.55cqw;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.po-boardEmpty{font-size:0.55cqw;color:#8a8e97;}',
      '.po-screenNames{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}',
      '.po-screenBtn{position:absolute;z-index:1;padding:0;border:0;border-radius:2px;background:transparent;',
      'cursor:pointer;pointer-events:auto;}',
      '.po-screenBtn:hover{background:rgba(200,236,230,.10);}',
      '.po-chairRole{position:absolute;z-index:3;transform:translate(-50%,-50%);padding:2px 9px;border-radius:6px;',
      'font:inherit;font-size:0.95cqw;line-height:1.45;font-weight:700;letter-spacing:.06em;color:#151a24;',
      'white-space:nowrap;pointer-events:auto;cursor:pointer;border:0;box-shadow:0 2px 0 rgba(0,0,0,.35);}',
      '.po-chairRole:hover{filter:brightness(1.08);}',
      '.po-chairSlot{background:rgba(20,26,42,.62);color:rgba(226,236,255,.8);',
      'border:1px dashed rgba(255,255,255,.38);font-weight:600;}',
      '.po-chairEmpty{opacity:.55;}',
      '.po-chairRole[data-role="supervisor"]{background:#e8b84a;}',
      '.po-chairRole[data-role="secretary"]{background:#48b0c9;}',
      '.po-offices{position:absolute;left:10px;top:10px;z-index:6;display:flex;flex-direction:column;',
      'align-items:flex-start;gap:4px;}',
      '.po-officeBtn{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border-radius:8px;',
      'border:1px solid rgba(255,255,255,.18);background:rgba(20,26,42,.72);color:#e8ecf5;',
      'font:inherit;font-size:12px;cursor:pointer;}',
      '.po-officeBtn:hover{background:rgba(34,43,68,.86);}',
      '.po-officeName{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.po-officeCaret{opacity:.7;font-size:10px;}',
      '.po-officeList{display:flex;flex-direction:column;gap:2px;padding:4px;border-radius:8px;',
      'border:1px solid rgba(255,255,255,.16);background:rgba(20,26,42,.94);',
      'box-shadow:0 8px 24px rgba(0,0,0,.35);max-height:260px;overflow:auto;}',
      '.po-officeItem{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:5px 8px;',
      'border:0;border-radius:6px;background:transparent;color:#e8ecf5;font:inherit;font-size:12px;',
      'cursor:pointer;text-align:left;min-width:190px;}',
      '.po-officeItem:hover{background:rgba(255,255,255,.08);}',
      '.po-officeItem[data-active="1"]{background:rgba(91,141,239,.28);}',
      '.po-officeItemName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.po-officeItemCount{font-size:10px;opacity:.7;flex:none;}',
      'transition:left .62s steps(8,end),top .3s steps(6,end);}',
      '.po-legL{animation:po-step .32s steps(2,end) infinite;}',
      '.po-legR{animation:po-step .32s steps(2,end) infinite reverse;}',
      'padding:4px 7px 5px;border-radius:8px;border:2px solid #2b2a33;background:#f7f3e8;color:#2b2a33;',
      'box-shadow:0 2px 0 rgba(0,0,0,.28);pointer-events:none;z-index:4;}',
      'margin-left:-4px;background:#f7f3e8;border-right:2px solid #2b2a33;border-bottom:2px solid #2b2a33;',
      'transform:rotate(45deg);}',
      'font-size:10px;line-height:13px;overflow-wrap:anywhere;}',
      '.po-sceneNotice{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;',
      'justify-content:center;gap:8px;padding:24px;text-align:center;background:rgba(12,16,28,.55);',
      'color:#f2f4fa;pointer-events:auto;}',
      '.po-sceneNoticeTitle{font-size:15px;font-weight:600;line-height:22px;}',
      '.po-sceneNoticeHint{font-size:12px;line-height:18px;color:#c8d0e4;max-width:340px;}',
      '.po-quip{position:absolute;z-index:5;transform:translate(-50%,-100%);max-width:22%;padding:3px 8px;',
      'border-radius:9px;border:2px solid #2b2a33;background:#f7f3e8;color:#2b2a33;font:inherit;',
      'font-size:0.55cqw;line-height:1.35;white-space:normal;text-align:center;pointer-events:none;',
      'box-shadow:0 2px 0 rgba(0,0,0,.3);animation:po-quipIn .25s ease-out;}',
      '.po-quip::after{content:"";position:absolute;left:50%;bottom:-6px;width:8px;height:8px;margin-left:-4px;',
      'background:#f7f3e8;border-right:2px solid #2b2a33;border-bottom:2px solid #2b2a33;transform:rotate(45deg);}',
      '.po-alert{position:absolute;z-index:5;transform:translate(0,-100%);z-index:5;pointer-events:none;',
      'padding:2px 7px;border-radius:8px;border:2px solid #2b2a33;background:#f7f3e8;color:#2b2a33;',
      'font:inherit;font-size:0.62cqw;line-height:1.4;font-weight:700;white-space:nowrap;',
      'box-shadow:0 1px 0 rgba(0,0,0,.3);}',
      '.po-alert::after{content:"";position:absolute;left:5px;bottom:-5px;width:6px;height:6px;',
      'background:inherit;border-right:2px solid #2b2a33;border-bottom:2px solid #2b2a33;transform:rotate(45deg);}',
      '.po-alert[data-kind="waiting"]{background:#ffe3a3;}',
      '.po-alert[data-kind="done"]{background:#c9f0d8;}',
      '.po-alert[data-kind="waiting"]{animation:po-pulse 1.4s ease-in-out infinite;}',
      '.po-modal{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;',
      'padding:20px;background:rgba(5,8,14,.48);}',
      '.po-modalCard{width:min(1080px,100%);height:min(90%,820px);display:flex;min-height:0;border-radius:16px;',
      'overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.45);}',
      '.po-avatarBar{flex:none;width:64px;display:flex;flex-direction:column;align-items:center;gap:6px;',
      'padding:8px 6px;overflow:auto;background:var(--dsw-alias-bg-layer-2);',
      'border-right:1px solid var(--dsw-alias-border-l1);}',
      '.po-avatarItem{position:relative;width:46px;height:46px;flex:none;padding:0;border-radius:10px;',
      'border:2px solid transparent;background:transparent;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;}',
      '.po-avatarItem:hover{background:var(--dsw-alias-bg-layer-1);}',
      '.po-avatarItem[data-active="1"]{border-color:var(--dsw-alias-brand-primary);',
      'background:var(--dsw-alias-bg-layer-1);}',
      '.po-avatarFace{display:flex;align-items:center;justify-content:center;width:100%;height:100%;}',
      '.po-avatarFace svg{width:34px;height:34px;display:block;}',
      '.po-avatarDot{position:absolute;right:0;bottom:0;width:10px;height:10px;border-radius:50%;',
      'border:2px solid var(--dsw-alias-bg-layer-2);}',
      '.po-modalCard .po-chat{border:0;border-radius:0;}',
      '.po-editorBackdrop{background:rgba(5,8,14,.55);}',
      '.po-editor{width:min(380px,100%);display:flex;flex-direction:column;gap:8px;padding:18px;',
      'border-radius:14px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);',
      'box-shadow:0 24px 60px rgba(0,0,0,.45);}',
      '.po-editorTitle{margin:0 0 2px;font-size:15px;line-height:22px;font-weight:600;}',
      '.po-editorLabel{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);}',
      '.po-editorInput{height:32px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);',
      'background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;}',
      'background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;}',
      '.po-editorError{margin:0;font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary);}',
      '.po-editorActions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px;}',
      '.po-editorSplit{justify-content:flex-start;align-items:center;}',
      '.po-editorGap{flex:1 1 auto;}',
      '.po-chat{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;border-radius:12px;',
      'border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);overflow:hidden;}',
      '.po-avatarWrap{position:relative;flex:none;width:44px;height:44px;}',
      '.po-avatarBig{display:flex;align-items:center;justify-content:center;width:44px;height:44px;',
      'border-radius:10px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;}',
      '.po-avatarBig svg{width:36px;height:36px;display:block;}',
      '.po-stateDot{position:absolute;right:-2px;bottom:-2px;width:12px;height:12px;border-radius:50%;',
      'border:2px solid var(--dsw-alias-bg-layer-1);box-sizing:content-box;}',
      '.po-chatHead{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:8px 10px;',
      'border-bottom:1px solid var(--dsw-alias-border-l1);min-width:0;}',
      '.po-chatWho{display:flex;flex-direction:column;min-width:0;flex:1 1 120px;}',
      '.po-chatName{display:flex;align-items:center;gap:6px;font-size:13px;line-height:18px;font-weight:600;',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.po-roleChip{flex:none;height:18px;padding:0 6px;border-radius:5px;border:1px solid var(--dsw-alias-border-l2);',
      'background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:10px;line-height:15px;',
      'font-weight:700;cursor:default;display:inline-flex;align-items:center;}',
      '.po-roleChip[data-role="supervisor"]{background:#e8b84a;border-color:transparent;color:#20180a;}',
      '.po-roleChip[data-role="secretary"]{background:#48b0c9;border-color:transparent;color:#0b2026;}',
      '.po-chatTools{display:flex;gap:2px;flex:none;}',
      '.po-iconBtn{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;',
      'border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);',
      'font-size:13px;cursor:pointer;}',
      '.po-iconBtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);}',
      '.po-chatMsgs{flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:12px 10px;}',
      '.po-chatNotice{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 8px;',
      'font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);text-align:center;}',
      '.po-chatRunning{display:flex;align-items:center;gap:6px;font-size:11px;line-height:16px;',
      'color:var(--dsw-alias-label-secondary);}',
      '.po-typingDot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-brand-primary);',
      'animation:po-pulse 1s ease-in-out infinite;}',
      '.po-line{display:flex;gap:8px;align-items:flex-start;max-width:100%;}',
      '.po-line[data-side="user"]{flex-direction:row-reverse;}',
      '.po-lineAvatar{width:28px;height:28px;flex:none;border-radius:6px;overflow:hidden;',
      'display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);}',
      '.po-lineAvatar svg{width:22px;height:22px;display:block;}',
      '.po-lineBody{display:flex;flex-direction:column;gap:4px;min-width:0;',
      'max-width:calc(100% - 40px);align-items:flex-start;}',
      '.po-line[data-side="user"] .po-lineBody{align-items:flex-end;}',
      '.po-bubble{padding:7px 10px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);',
      'border:1px solid var(--dsw-alias-border-l1);font-size:13px;line-height:20px;',
      'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%;}',
      '.po-line[data-side="user"] .po-bubble{border-color:transparent;',
      'background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 22%,var(--dsw-alias-bg-layer-1));}',
      '.po-lightbox{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;',
      'justify-content:center;gap:8px;background:rgba(10,12,20,.86);cursor:zoom-out;}',
      '.po-lightboxImg{max-width:86%;max-height:74%;border-radius:8px;border:2px solid #f7f3e8;image-rendering:pixelated;}',
      '.po-lightboxName{padding:14px 18px;border-radius:8px;background:#f7f3e8;color:#151a24;font-weight:600;}',
      '.po-lightboxHint{color:#c9cddb;font-size:12px;}',
      '.po-img{display:block;max-width:min(100%,240px);max-height:240px;border-radius:8px;',
      'border:1px solid var(--dsw-alias-border-l1);object-fit:contain;background:var(--dsw-alias-bg-layer-2);}',
      '.po-imgPending{display:inline-flex;align-items:center;justify-content:center;min-width:64px;height:40px;',
      'border-radius:8px;border:1px dashed var(--dsw-alias-border-l2);font-size:12px;',
      'color:var(--dsw-alias-label-secondary);}',
      '.po-fileCard{display:inline-flex;align-items:center;gap:8px;max-width:100%;padding:6px 10px;',
      'border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);}',
      '.po-fileGlyph{font-size:16px;line-height:18px;flex:none;}',
      '.po-fileText{display:flex;flex-direction:column;gap:1px;min-width:0;}',
      '.po-fileName{font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.po-fileSize{font-size:10px;line-height:13px;color:var(--dsw-alias-label-secondary);}',
      '.po-chatError{padding:4px 10px;font-size:11px;line-height:16px;color:var(--dsw-alias-state-error-primary);}',
      '.po-compose{display:flex;flex-direction:column;gap:6px;padding:8px;',
      'border-top:1px solid var(--dsw-alias-border-l1);}',
      '.po-attachRow{display:flex;flex-wrap:wrap;gap:6px;}',
      '.po-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:3px 4px 3px 6px;',
      'border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);}',
      '.po-chipImg{width:22px;height:22px;border-radius:4px;object-fit:cover;flex:none;}',
      '.po-chipGlyph{font-size:14px;line-height:16px;flex:none;}',
      '.po-chipName{font-size:11px;line-height:15px;max-width:150px;overflow:hidden;',
      'text-overflow:ellipsis;white-space:nowrap;}',
      '.po-chipRemove{width:18px;height:18px;border:0;border-radius:4px;background:transparent;',
      'color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:16px;cursor:pointer;flex:none;}',
      '.po-chipRemove:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);}',
      '.po-composeRow{display:flex;gap:6px;align-items:flex-end;}',
      '.po-fileInput{display:none;}',
      '.po-composeArea{flex:1 1 auto;min-width:0;max-height:120px;min-height:34px;resize:vertical;',
      'padding:7px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);',
      'background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);',
      'font:inherit;font-size:12px;line-height:18px;}',
      '.po-composeArea:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px;}',
      '.po-composeActions{display:flex;gap:6px;flex:none;justify-content:flex-end;}',
      '.po-crash{margin:auto;display:flex;flex-direction:column;align-items:center;gap:10px;',
      'max-width:420px;padding:24px;text-align:center;}',
      '@keyframes po-type{0%,100%{transform:translateY(0);}50%{transform:translateY(-1px);}}',
      '@keyframes po-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-1px);}}',
      '@keyframes po-hop{0%,100%{transform:translateY(0);}50%{transform:translateY(-2px);}}',
      '@keyframes po-pulse{0%,100%{opacity:1;}50%{opacity:.6;}}',
      '@keyframes po-walkbob{0%,100%{transform:translateY(0);}50%{transform:translateY(-1px);}}',
      '@keyframes po-step{0%,100%{transform:translateY(0);}50%{transform:translateY(-1px);}}',
      '.po-armDesk{animation:none;}',
      '.po-spriteBtn[data-state="working"] .po-armDesk{animation:po-type .7s steps(2,end) infinite;}',
      '.po-spriteBtn[data-state="working"] .po-head{animation:po-bob 2.4s steps(2,end) infinite;}',
      '.po-spriteBtn[data-state="waiting"] .po-spriteSvg{animation:po-hop 1.6s steps(2,end) infinite;}',
      '.po-spriteBtn[data-state="idle"] .po-spriteSvg{opacity:.92;}',
      '@media (max-width:600px){.po-chairRole{font-size:1.4cqw;}}',
      '@media (prefers-reduced-motion:reduce){.po-page *{animation:none!important;transition:none!important;}}',
    ].join('')

    // --------------------------------------------------------------------- apply

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, DICT), 'pixel-office: dictionaries')
      const t = ctx.locale.bind(NS)

      const layout = ctx.get('layout')
      const selectPanel = (id) => {
        if (!layout || typeof layout.selectPanel !== 'function') return
        try {
          layout.selectPanel(id)
        } catch (error) {
          console.error('[pixel-office] panel selection failed', error)
        }
      }

      const backToChat = () => { selectPanel(null) }

      const openAgent = (sessionId) => {
        const workspace = ctx.get('uiWorkspace')
        if (workspace && typeof workspace.openSession === 'function') {
          try {
            workspace.openSession(sessionId)
          } catch (error) {
            console.error('[pixel-office] openSession failed', error)
          }
        }
        backToChat()
      }

      const startSession = (workspaceId) => {
        const workspace = ctx.get('uiWorkspace')
        if (workspace && typeof workspace.startSession === 'function') {
          try {
            workspace.startSession(workspaceId)
          } catch (error) {
            console.error('[pixel-office] startSession failed', error)
          }
        }
        backToChat()
      }

      // Attachments: images resolve through the conversation's image store, and
      // files stage through the browser upload service before a prompt cites them.
      const imageUrlOf = (sessionId, attachment) => {
        const conversation = ctx.get('uiConversation')
        if (!conversation || typeof conversation.imageUrl !== 'function') {
          return Promise.reject(new Error('image store unavailable'))
        }
        return conversation.imageUrl(sessionId, attachment)
      }

      const archiveSession = (sessionId) => {
        const workspacesService = ctx.get('workspaces')
        if (!workspacesService || typeof workspacesService.archiveSession !== 'function') {
          return Promise.reject(new Error('archive unavailable'))
        }
        return workspacesService.archiveSession(sessionId, { stopActivity: true })
      }

      const uploadFile = (sessionId, file, name) => {
        const uploads = ctx.get('fileUpload')
        if (!uploads || typeof uploads.upload !== 'function') {
          return Promise.reject(new Error('file upload unavailable'))
        }
        return uploads.upload(sessionId, file, name)
      }

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({
          openAgent,
          startSession,
          backToChat,
          sessions: ctx.sessions,
          imageUrlOf,
          uploadFile,
          archiveSession,
        }),
      }, OfficePage))

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 30,
        locale: NS,
        label: () => t('panel'),
      }, OfficeIcon))

      // Land on the office when this page asks for it.
      ctx.effect(() => {
        let cancelled = false
        const timer = window.setTimeout(() => {
          if (cancelled) return
          const info = layout && layout.panelInfo
          const current = info && typeof info.getSnapshot === 'function' ? info.getSnapshot() : null
          if (current && current.activePanelId === PANEL_ID) return
          selectPanel(PANEL_ID)
        }, 400)
        return () => {
          cancelled = true
          window.clearTimeout(timer)
        }
      }, 'pixel-office: landing')
    }

    return { inject: ['slots', 'locale', 'sessions'], apply }
  },
})
