import { WebClient } from '@slack/web-api';

function main(): void {
    const token = process.env.SLACK_TOKEN;
    const web = new WebClient(token);
    const conversationId = '#general';
    (async (): Promise<void> => {
        const res = await web.chat.postMessage({
            channel: conversationId,
            text: 'Hello there',
        });
        console.log('Message sent: ', res.ts);
    })();
}

export = { main };
