import fs from 'fs';
import path from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';

// promise化
const readDir = promisify(fs.readdir);
const exec = promisify(_exec);

/* 型情報 */
export interface ArticleImpl {
    name: string;
    date: string;
    url: string;
}

/* ファイル名称の一覧を取得する */
const getNames = async (pth: string): Promise<string[]> => {
    // ファイルの一覧を取得する
    const files = await readDir(pth);
    return files.map((x: string): string => path.basename(x));
};

/* 引数で受け取ったフォルダパス配下から、ファイル名を取得する
 * ファイル名から直近のyyyymmddを取得する */
const getLastDate = (names: string[]): number => {
    // ファイル名からyyyymmdd部分のみ取得
    const ymd = names.map((x: string): number => parseInt(x.substr(0, 8)));
    // 最新の日付を取得する
    return ymd.reduce((prev: number, ltst: number): number => {
        return prev >= ltst ? prev : ltst;
    });
};

/* 引数で受け取ったyyyymmddとファイルパスによって、
 * 同一'yyyymmdd'のファイル名の配列を取得する */
const getLatestFiles = (names: string[], ymd: number): string[] => {
    // ファイル一覧を取得する
    return names.filter(
        (x: string): boolean => ymd.toString() === x.substr(0, 8)
    );
};

/* 2つのファイル名称の配列から、サイト名が合致するペアを返す */
const getPairOfSite = (hist: string[], ltst: string[]): [string, string][] => {
    let pairs: [string, string][] = [];
    let matched: string[] = [];
    hist.forEach((x: string): void => {
        matched = ltst.filter(
            (y: string): boolean => x.substr(15) === y.substr(15)
        );
        pairs.push([x, matched[0]]);
    });
    return pairs;
};

/* ペアについてdiffを実行する */
const execDiff = async (
    histPath: string,
    ltstPath: string
): Promise<string> => {
    let result = '';
    try {
        await exec(`diff ${histPath} ${ltstPath}`);
    } catch (_out) {
        /* promise化したexecで、diffコマンドを実行した場合、差異があるとエラー扱いになる
         * エラーオブジェクトが持っている標準出力を渡す */
        result = _out.stdout;
    }
    return result;
};

/* diffの実行結果から、差分があるかチェック */
const checkDiff = (stdout: string): boolean =>
    stdout.includes('date') && stdout.includes('url');

/* diffの実行結果から、投稿用の記事情報を取得 */
const getArticles = (stdout: string, ltstPath: string): ArticleImpl[] => {
    const result: ArticleImpl[] = [];
    // 処理用の変数群
    let _name = '';
    let _temp: ArticleImpl = { name: '', date: '', url: '' };

    // ++ name ++
    // ファイル名からサイト名を抽出
    let matched: RegExpExecArray | null;
    matched = /\d{14}_(.+)\.json/.exec(path.basename(ltstPath));
    _name = matched ? matched[1] : '';

    const parts = stdout.split(/\n/).map((x: string): string => x.trim());
    for (var x of parts) {
        // ++ date ++
        matched = /"date"\:\s{1}"(\d+[\.|\/]\d+[\.|\/]\d+)"/.exec(x);
        if (matched !== null) {
            // dateが見つかったら初期化
            _temp = { name: _name, date: '', url: '' };
            _temp.date = matched[1];
            continue;
        }
        // ++ url ++
        matched = /"url"\:\s{1}"(.+)"/.exec(x);
        if (matched !== null) {
            // urlが見つかったら追加
            _temp.url = matched[1];
            result.push(_temp);
            continue;
        }
    }
    return result;
};

/* diffの実行から結果の整形までまとめ */
const combineDiff = async (
    histPath: string,
    ltstPath: string
): Promise<ArticleImpl[]> => {
    const stdout = await execDiff(histPath, ltstPath);
    if (!checkDiff(stdout)) return [];
    return getArticles(stdout, ltstPath);
};

/**
 * 差分抽出のメイン処理
 * @param {string} histPath
 * @param {string} ltstPath
 * @returns {[string, string]} 送信先のチャンネル名 ／ URL
 */
export default async function main(
    histPath: string,
    ltstPath: string
): Promise<ArticleImpl[]> {
    // ファイル名を取得する
    const histNames = await getNames(histPath);
    const ltstNames = await getNames(ltstPath);

    // 最後の実行日付を取得する
    const lastRunDate = getLastDate(histNames);
    const executeDate = getLastDate(ltstNames);

    // 同一の実行日付のファイルの一覧を取得する
    const prevFiles = getLatestFiles(histNames, lastRunDate);
    const ltstFiles = getLatestFiles(ltstNames, executeDate);

    // ペアとなるファイル名を取得する
    const comparisons = getPairOfSite(prevFiles, ltstFiles);

    // Array#map用のメソッド
    const mapper = (x: [string, string]): Promise<ArticleImpl[]> => {
        return combineDiff(
            path.join(histPath, x[0]),
            path.join(ltstPath, x[1])
        );
    };

    // 非同期（xN）=> 同期
    let articles: ArticleImpl[][] = await Promise.all(comparisons.map(mapper));

    // 平準化して返す（二次元 -> 一次元へ）
    return articles.flat();
    //#region Node.jsの、Ver.11以下の場合
    /*
    return articles.reduce(
        (prev: ArticleImpl[], curr: ArticleImpl[]): ArticleImpl[] => {
            prev.push(...curr);
            return prev;
        },
        []
    );
    */
    //#endregion
}
