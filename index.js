const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Конфигурация токенов
const VERIFY_TOKEN = 'ВАШ_ПРОВЕРОЧНЫЙ_ТОКЕН';
const PAGE_ACCESS_TOKEN = 'ВАШ_ТОКЕН_СТРАНИЦЫ';

// Функция отправки сообщений через Messenger API
const sendMessage = async (recipientId, message) => {
  const url = `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  try {
    await axios.post(url, {
      recipient: { id: recipientId },
      message: message,
    });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error.response.data);
  }
};

// Функция отправки кнопок
const sendButtons = async (recipientId) => {
  const buttons = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Выберите действие:',
        buttons: [
          {
            type: 'postback',
            title: 'Информация',
            payload: 'INFO',
          },
          {
            type: 'postback',
            title: 'Связаться с админом',
            payload: 'CONTACT_ADMIN',
          },
        ],
      },
    },
  };
  await sendMessage(recipientId, buttons);
};

// Обработка вебхука
app.post('/webhook', async (req, res) => {
  const data = req.body;

  if (data.object === 'page') {
    for (const entry of data.entry) {
      for (const event of entry.messaging) {
        const senderId = event.sender.id;

        if (event.message) {
          // Отправляем кнопки при получении сообщения
          await sendButtons(senderId);
        } else if (event.postback) {
          const payload = event.postback.payload;

          if (payload === 'INFO') {
            await sendMessage(senderId, { text: 'Вот информация о нашем сервисе.' });
          } else if (payload === 'CONTACT_ADMIN') {
            await sendMessage(senderId, { text: 'Админ скоро свяжется с вами.' });
            // Здесь вы можете уведомить админа через вашу систему.
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Проверка вебхука
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
