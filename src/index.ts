/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import execDiff from './diff';
import distribute from './distribute';

// 自作の簡易ログ（js）
type Logger = (message: string) => void;
const writeLog: Logger = require('./helper/logger');

// Promiseのエラーがcatchされなかった場合
process.on('unhandledRejection', (reason: unknown): void => {
    if (typeof reason === 'string') {
        writeLog(`${reason}`); // ログに残しておく
        console.log(`${reason}`);
    }
});

// 予期せぬエラー
process.on('uncaughtException', (err: Error): void => {
    process.stderr.write(err.message);
    process.abort();
});

/* メイン処理開始 */
writeLog('----------');
writeLog('メイン処理を開始します');

// init.jsonを読み込む
const conf = JSON.parse(fs.readFileSync('./init.json', 'utf8'));

// 環境変数SLACK_TOKENに値が設定されていなかったら、init.jsonからtokenをセット
if (!process.env.SLACK_TOKEN) process.env.SLACK_TOKEN = conf.token;

(async (): Promise<void> => {
    writeLog('クローラー結果ファイルの差分を取得します');
    const result = await execDiff(conf.inputHistoryDir, conf.inputLatestDir);
    // 差分がある場合のみ投稿する
    if (result.length > 0) {
        writeLog(
            `>> 新着記事を ${result.length} 件検知しました。Slackへ投稿します`
        );
        distribute(result);
    } else {
        writeLog('>> 新着記事はありません');
    }
    writeLog('メイン処理が完了しました');
})();
