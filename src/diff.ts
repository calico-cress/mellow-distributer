import fs from 'fs';
import path from 'path';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';

// promise化
const readDir = promisify(fs.readdir);
const exec = promisify(_exec);
const writeFile = promisify(fs.writeFile);

/* 型情報 */
export interface ArticleImpl {
  name: string;
  date: string;
  url: string;
}

/* 引数で受け取った名称の空ファイルを作成する */
export const touch = async (path: string): Promise<void> => {
  try {
    await writeFile(path, '');
  } catch {}
};

/* ファイル名称の一覧を取得する */
export const getNames = async (pth: string): Promise<string[]> => {
  // ファイルの一覧を取得する
  const files = await readDir(pth);
  return files.map((x: string): string => path.basename(x));
};

/* 引数で受け取ったファイルの一覧から直近のyyyymmddを取得する */
export const getLastDate = (names: string[]): number => {
  // ファイル名からyyyymmdd部分のみ取得
  return names
    .filter((x: string): boolean => isFinite(parseInt(x.substring(0, 8))))
    .map((x: string): number => {
      return parseInt(x.substring(0, 8));
    })
    .reduce((prev: number, ltst: number): number => {
      return prev >= ltst ? prev : ltst;
    });
};

/* 引数で受け取ったファイル一覧とyyyymmddによって、
 * 同一'yyyymmdd'のファイル名の配列を取得する */
export const getLatestFiles = (names: string[], ymd: number): string[] => {
  // ファイル一覧を取得する
  return names.filter(
    (x: string): boolean => ymd.toString() === x.substring(0, 8)
  );
};

/* 2つのファイル名称の配列から、サイト名が合致するペアを返す
 * 組合せが見つからない場合、dummy.txtをペアにする */
export const getPairOfSite = (
  hist: string[],
  ltst: string[]
): [string, string][] => {
  let pairs: [string, string][] = [];
  let matched: string[] = [];
  // 最新ファイルの一覧から、過去分ファイルを探す
  ltst.forEach((x: string): void => {
    matched = hist.filter(
      (y: string): boolean => x.substring(15) === y.substring(15)
    );
    pairs.push([matched[0] || 'dummy.txt', x]);
  });
  return pairs;
};

/* ペアについてdiffを実行する */
export const execDiff = async (
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
export const checkDiff = (stdout: string): boolean =>
  stdout.includes('date') && stdout.includes('url');

/* diffの実行結果から、投稿用の記事情報を取得 */
export const getArticles = (
  stdout: string,
  ltstPath: string
): ArticleImpl[] => {
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
    // 先頭が">"から開始する
    if (!/^>.+/.test(x)) continue;
    // ++ date ++
    matched = /"date"\:\s{1}"(\d+[\.|\/|-]\d+[\.|\/|-]\d+)"/.exec(x);
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
export const combineDiff = async (
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
  // dummy.txtを作成する
  await touch(path.join(histPath, 'dummy.txt'));

  // ファイル名を取得する
  const histNames = await getNames(histPath);
  const ltstNames = await getNames(ltstPath);

  // 同一の実行日付のファイルの一覧を取得する
  const prevFiles = getLatestFiles(histNames, getLastDate(histNames));
  const ltstFiles = getLatestFiles(ltstNames, getLastDate(ltstNames));

  // ペアとなるファイル名を取得する
  const comparisons = getPairOfSite(prevFiles, ltstFiles);

  // Array#map用のメソッド
  const mapper = (x: [string, string]): Promise<ArticleImpl[]> => {
    return combineDiff(path.join(histPath, x[0]), path.join(ltstPath, x[1]));
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
