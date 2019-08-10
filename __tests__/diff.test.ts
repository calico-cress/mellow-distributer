import path from 'path';
import * as diff from '../src/diff';

// テスト用資材
const matePath = `${__dirname}/materials`;
const testList = [
  '99990101000000_index01.txt',
  '99991231000000_index02.txt',
  '99991231000000_index03.txt',
];

describe('diff', (): void => {
  // getNames
  describe('getNames()', (): void => {
    test('ファイルの一覧を取得する', async (): Promise<void> => {
      const result = await diff.getNames(matePath);
      expect(result).toEqual(testList);
    });
  });
  // getLastDate
  describe('getLastDate()', (): void => {
    test('ファイル名に含まれる最新の日付を取得する', (): void => {
      expect(diff.getLastDate(testList)).toBe(99991231);
    });
    test('日付が無いファイルが混在していても無視する', (): void => {
      expect(diff.getLastDate(['test01.txt', 'test02.txt', ...testList])).toBe(
        99991231
      );
    });
  });
  // getLatestFiles
  describe('getLatestFiles()', (): void => {
    test('日付に合致したファイルを抽出する', (): void => {
      expect(diff.getLatestFiles(testList, 99991231)).toEqual([
        '99991231000000_index02.txt',
        '99991231000000_index03.txt',
      ]);
    });
    test('日付が無いファイルが混在していても無視する', (): void => {
      expect(
        diff.getLatestFiles(['test01.txt', 'test02.txt', ...testList], 99991231)
      ).toEqual(['99991231000000_index02.txt', '99991231000000_index03.txt']);
    });
  });
  // getPairOfSite
  describe('getPairOfSite()', (): void => {
    test('配列同士から、サイト名が合致する組合せを取得する', (): void => {
      expect(
        diff.getPairOfSite(testList, ['19000101235959_index03.txt'])
      ).toEqual([['99991231000000_index03.txt', '19000101235959_index03.txt']]);
    });
    test('完全新規の場合、dummy.txtという空ファイルをペアにする', (): void => {
      expect(
        diff.getPairOfSite(testList, ['19990101235959_index04.txt'])
      ).toEqual([['dummy.txt', '19990101235959_index04.txt']]);
    });
  });
  // execDiff
  describe('execDiff()', (): void => {
    test('差分が無い場合は、空白文字を返す', async (): Promise<void> => {
      const result = await diff.execDiff(
        path.join(matePath, '99990101000000_index01.txt'),
        path.join(matePath, '99990101000000_index01.txt')
      );
      expect(result).toEqual('');
    });
    test('差分がある場合は、文字列を返す', async (): Promise<void> => {
      const result = await diff.execDiff(
        path.join(matePath, '99990101000000_index01.txt'),
        path.join(matePath, '99991231000000_index03.txt')
      );
      expect(typeof result === 'string').not.toEqual('');
      expect(result.length > 0).toBeTruthy();
    });
  });
});
