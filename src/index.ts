import fs from 'fs';
import execDiff from './diff';
import distribute from './distribute';
//import logger from './helper/logger';

//#region 例外処理.. 追々実装
// Promiseのエラーがcatchされなかった場合
/*
process.on('unhandledRejection', (reason: unknown): void => {
    if (typeof reason === 'string') {
        console.log(`${reason}`);
    }
});
//*/

// 予期せぬエラー
/* 
process.on('uncaughtException', (err: Error): void => {
    process.stderr.write(err.message);
    process.abort();
});
//*/
//#endregion

/* メイン処理開始 */

// init.jsonを読み込む
const conf = JSON.parse(fs.readFileSync('./init.json', 'utf8'));

// 環境変数SLACK_TOKENに値が設定されていなかったら、init.jsonからtokenをセット
if (!process.env.SLACK_TOKEN) process.env.SLACK_TOKEN = conf.token;

(async (): Promise<void> => {
    const result = await execDiff(conf.inputHistoryDir, conf.inputLatestDir);
    if (result.length > 0) distribute(result);
})();
