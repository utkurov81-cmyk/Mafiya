const { getPlayerName, getRoleInfo } = require('./helpers');

const MAFIA_UZ = '🎭 <b>MAFIA UZ</b>';

const messages = {
  welcome: (firstName) => `
${MAFIA_UZ}

🌑 <i>Xush kelibsiz, ${firstName}!</i>

━━━━━━━━━━━━━━━━━━━━━
🔪 <b>Shahar uxlaydi...</b>
<i>Lekin Mafia hech qachon uxlamaydi.</i>
━━━━━━━━━━━━━━━━━━━━━

Siz professional Mafia o'yiniga qadamingizni qo'ydingiz.
Bu erda haqiqiy mahorat, mantiq va aldash mahoratlari sinab ko'riladi.

<b>Quyi menyu orqali boshlang:</b>
  `,

  roomCreated: (room, owner) => `
🏠 <b>YANGI XONA YARATILDI</b>
━━━━━━━━━━━━━━━━━━━━━
🔑 <b>Xona kodi:</b> <code>${room.code}</code>
👑 <b>Egasi:</b> ${getPlayerName(owner)}
👥 <b>O'yinchilar:</b> 1/15
⚙️ <b>Holat:</b> Kutilmoqda...
━━━━━━━━━━━━━━━━━━━━━

<i>Xona kodini do'stlaringizga yuboring!</i>
<i>O'yin boshlash uchun kamida 4 o'yinchi kerak.</i>
  `,

  lobbyStatus: (room, players) => {
    const playerList = players.map((p, i) =>
      `  ${i + 1}. ${getPlayerName(p)}`
    ).join('\n');
    return `
🏠 <b>XONA: ${room.code}</b>
━━━━━━━━━━━━━━━━━━━━━
👥 <b>O'yinchilar (${players.length}/15):</b>
${playerList || '  <i>Hali hech kim yo\'q</i>'}
━━━━━━━━━━━━━━━━━━━━━
⏳ <b>O'yin boshlanishi kutilmoqda...</b>
<i>Kamida 4 nafar kerak</i>
    `;
  },

  roleAssignment: (role) => {
    const info = getRoleInfo(role);
    return `
🎭 <b>SIZNING ROLINGIZ</b>
━━━━━━━━━━━━━━━━━━━━━
${info.color} ${info.emoji} <b>${info.name.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━

📋 <b>Vazifangiz:</b>
<i>${info.description}</i>
━━━━━━━━━━━━━━━━━━━━━
🤫 <b>Bu ma'lumot faqat sizga!</b>
<i>Rolni hech kimga aytmang.</i>
    `;
  },

  nightStart: (roundNumber) => `
🌑 <b>KECHA BOSHLANDI</b>
━━━━━━━━━━━━━━━━━━━━━
🌙 ${roundNumber}-kecha boshlanmoqda...

<i>Shahar uxlaydi...</i>
<i>Mafia uyg'onadi...</i>

🔪 Mafiyalar nishon tanlayapti...
🕵️ Komissar tekshirayapti...
🩺 Shifokor himoyalayapti...
━━━━━━━━━━━━━━━━━━━━━
⏳ <b>Natija ko'p o'tmay e'lon qilinadi...</b>
  `,

  dayStart: (roundNumber, nightResult) => {
    let resultText = '';
    if (nightResult.killed) {
      resultText = `☠️ <b>Kechasi:</b> ${nightResult.killedName} o'ldirildi!\n`;
    } else if (nightResult.savedByDoctor) {
      resultText = `🛡️ <b>Kechasi:</b> Shifokor kimnidir qutqardi! Hech kim o'lmadi.\n`;
    } else {
      resultText = `✅ <b>Kechasi:</b> Hech kim o'lmadi!\n`;
    }
    return `
☀️ <b>TONG OTDI</b>
━━━━━━━━━━━━━━━━━━━━━
🌅 ${roundNumber}-kunduz boshlanmoqda...

${resultText}━━━━━━━━━━━━━━━━━━━━━
💬 <b>Muhokama boshlandi!</b>
<i>Kim Mafia? Birgalikda toping!</i>
    `;
  },

  votingStart: (players) => {
    const list = players.map((p, i) => `  ${i + 1}. ${getPlayerName(p)}`).join('\n');
    return `
🗳️ <b>OVOZ BERISH BOSHLANDI</b>
━━━━━━━━━━━━━━━━━━━━━
<b>Kim shahardan haydab chiqarilsin?</b>

${list}
━━━━━━━━━━━━━━━━━━━━━
<i>Shaxsiy xabardagi tugmadan ovoz bering!</i>
    `;
  },

  voteResult: (eliminated, isSkip, isTie, votes) => {
    if (isSkip || isTie) {
      return `
🗳️ <b>OVOZ BERISH NATIJASI</b>
━━━━━━━━━━━━━━━━━━━━━
⚖️ <b>${isTie ? 'Durang!' : 'Ovoz berilmadi!'}</b>
<i>Hech kim shahardan chiqarilmadi.</i>
━━━━━━━━━━━━━━━━━━━━━
      `;
    }
    const info = getRoleInfo(eliminated.role);
    return `
🗳️ <b>OVOZ BERISH NATIJASI</b>
━━━━━━━━━━━━━━━━━━━━━
❌ <b>${getPlayerName(eliminated)}</b> shahardan haydab chiqarildi!
🎭 U aslida: ${info.emoji} <b>${info.name}</b> edi!
━━━━━━━━━━━━━━━━━━━━━
    `;
  },

  gameOver: (winnerTeam, players) => {
    const roleReveal = players.map(p => {
      const info = getRoleInfo(p.role);
      const status = p.status === 'alive' ? '✅' : '💀';
      return `  ${status} ${info.emoji} ${getPlayerName(p)} — <b>${info.name}</b>`;
    }).join('\n');

    const winText = winnerTeam === 'mafia'
      ? '🔪 <b>MAFIA G\'ALABA QOZONDI!</b>\n<i>Shahar qorong\'ulikka cho\'mdi...</i>'
      : '🏛️ <b>FUQAROLAR G\'ALABA QOZONDI!</b>\n<i>Shahar tinchlikka erishdi!</i>';

    return `
${winText}
━━━━━━━━━━━━━━━━━━━━━
🎭 <b>BARCHA ROLLAR:</b>
${roleReveal}
━━━━━━━━━━━━━━━━━━━━━
🏆 Tabriklaymiz g\'oliblar!
    `;
  },

  aliveList: (players) => {
    const list = players.map((p, i) =>
      `  ${i + 1}. ${getPlayerName(p)}`
    ).join('\n');
    return `👥 <b>Tirik o'yinchilar:</b>\n${list}`;
  },
};

module.exports = messages;
