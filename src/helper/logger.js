/* I/Oや日付関連 */
import { mkdir as _mkdir, appendFile as _appendFile } from 'fs'; // ファイルIO
import moment from 'moment'; // 日付操作
import { promisify } from 'util';

// promise化
const mkdir = promisify(_mkdir);
const appendFile = promisify(_appendFile);

/**
 * ログ出力
 * @param {string} message
 */
export default message => {
    let appendLog = () =>
        appendFile(
            './logs/app.log',
            moment().format('YYYY/MM/DD HH:mm:ss') + ' ' + message + '\n'
        );
    // （node.jsの流儀に従い）フォルダの存在チェックはしない
    mkdir('./logs/')
        .then(
            // 初回のみ、mkdirはfulfilledになる
            () => appendLog(),
            err => {
                // 既にフォルダが存在する場合（2回目以降）
                if (err && err.code === 'EEXIST') appendLog();
            }
        )
        .catch(err => {
            if (err) console.log(err);
        });
};
