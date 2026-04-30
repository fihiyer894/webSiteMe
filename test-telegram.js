// ─── Швидкий тест підключення Telegram-бота ───
// Запуск: node test-telegram.js

const TOKEN   = '8519232112:AAHWbdb_i6wjMqogD3blZqE-mkewTLHt95c';
const CHAT_ID = '887078537';
const BASE    = `https://api.telegram.org/bot${TOKEN}`;

async function test() {
  console.log('\n🤖 telegrambot.studio — Telegram connection test\n');
  console.log('─'.repeat(48));

  // 1. Перевірка токена
  process.stdout.write('[1/2] getMe ...  ');
  try {
    const r1   = await fetch(`${BASE}/getMe`);
    const data = await r1.json();

    if (!data.ok) {
      console.log('❌ FAIL');
      console.log(`     Error: ${data.description}`);
      process.exit(1);
    }

    const { username, first_name, id } = data.result;
    console.log('✅ OK');
    console.log(`     Bot: @${username} (${first_name}), id=${id}`);
  } catch (e) {
    console.log('❌ Network error');
    console.log(`     ${e.message}`);
    process.exit(1);
  }

  // 2. Відправка тестового повідомлення
  process.stdout.write('[2/2] sendMessage ... ');
  const text = `📩 <b>Тест — telegrambot.studio</b>\n\n` +
               `👤 <b>Ім'я:</b> Тестовий клієнт\n` +
               `📞 <b>Контакт:</b> @test_user\n` +
               `💬 <b>Повідомлення:</b> Це тестова заявка з сайту\n\n` +
               `🕐 ${new Date().toUTCString()}`;

  try {
    const r2   = await fetch(`${BASE}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
    });
    const data = await r2.json();

    if (!data.ok) {
      console.log('❌ FAIL');
      console.log(`     Error: ${data.description}`);
      console.log('\n💡 Підказка: напишіть боту першим у Telegram,');
      console.log('   щоб він міг надсилати вам повідомлення.');
      process.exit(1);
    }

    console.log('✅ OK');
    console.log(`     Message id: ${data.result.message_id}`);
    console.log('\n─'.repeat(48));
    console.log('🎉 Все працює! Перевірте Telegram — повідомлення вже там.\n');
  } catch (e) {
    console.log('❌ Network error');
    console.log(`     ${e.message}`);
    process.exit(1);
  }
}

test();
