require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const piadas = JSON.parse(fs.readFileSync('./piadas.json', 'utf8'));
const conversas = JSON.parse(fs.readFileSync('./conversas.json', 'utf8'));

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => qrcode.generate(qr, {small: true}));
client.on('ready', () => console.log('BOT COM IA ONLINE! 🧠💜'));

client.on('message', async msg => {
    const chat = await msg.getChat();
    if(!chat.isGroup) return;

    const texto = msg.body;
    const textoLower = texto.toLowerCase();

    // 1. Respostas rápidas primeiro
    for(const palavra in conversas){
        if(textoLower.includes(palavra)){
            const respostas = conversas[palavra];
            msg.reply(respostas[Math.floor(Math.random() * respostas.length)]);
            return;
        }
    }

    // 2. Comandos
    if(textoLower === '!piada') return msg.reply(piadas[Math.floor(Math.random() * piadas.length)]);
    if(textoLower === '!sorte'){
        const sortes = ['Sua sorte hoje: Green 🍀', 'Cooperação roxa #9333EA', 'Fé que hoje cai'];
        return msg.reply(sortes[Math.floor(Math.random() * sortes.length)]);
    }
    if(textoLower.startsWith('!audio')){
        const num = textoLower.split(' ')[1];
        if(num >= 1 && num <= 5){
            const media = MessageMedia.fromFilePath(`./audios/audio${num}.mp3`);
            return client.sendMessage(msg.from, media);
        }
    }

    // 3. SE NÃO FOR COMANDO, MANDA PRA IA RESPONDER
    try {
        const prompt = `Você é um bot zoeiro de grupo de WhatsApp do Brasil. Fala gíria, é engraçado, fala de PG, cooperação, sorte. Responde curto, 1 a 2 linhas. Alguém disse: "${texto}". Responde:`;

        const result = await model.generateContent(prompt);
        const resposta = result.response.text();
        msg.reply(resposta);

    } catch (error) {
        console.log('Erro IA:', error);
        msg.reply('Opa, meu cérebro travou kkk tenta de novo');
    }
});

client.initialize();
