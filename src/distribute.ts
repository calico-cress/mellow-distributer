import { WebClient, WebAPICallResult } from '@slack/web-api';
import { ArticleImpl } from './diff';

/**
 * slack投稿のメイン処理
 * @export
 * @param {ArticleImpl[]} articles 投稿する記事情報
 */
export default function main(articles: ArticleImpl[]): void {
    const token = process.env.SLACK_TOKEN; // トークン
    const client = new WebClient(token);
    const conversationId = '#prod_mellow_news'; // 投稿先
    // 投稿用の非同期メソッド（xN）
    const messages = articles.map(
        (x: ArticleImpl): Promise<WebAPICallResult> => {
            return client.chat.postMessage({
                channel: conversationId,
                text: `${x.name}：${x.date.replace(/\.|-/g, '/')}\n${x.url}`,
                // eslint-disable-next-line @typescript-eslint/camelcase
                unfurl_links: true,
            });
        }
    );
    // メッセージ送信
    (async (): Promise<void> => {
        const result = await Promise.all(messages);
        console.log(`${result.length} Message sent..`);
    })();
}
