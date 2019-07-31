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
    describe('getNames() >>', (): void => {
        test('ファイルの一覧を取得する', async (): Promise<void> => {
            const result = await diff.getNames(matePath);
            expect(result).toEqual(testList);
        });
    });
    // getLastDate
    describe('getLastDate() >>', (): void => {
        test('ファイル名に含まれる最新の日付を取得する', (): void => {
            expect(diff.getLastDate(testList)).toBe(99991231);
        });
        /* TODO：ファイル名に日付がない場合のテスト追加 */
    });
    // getLatestFiles
    describe('getLatestFiles() >>', (): void => {
        test('日付に合致したファイルを抽出する', (): void => {
            expect(diff.getLatestFiles(testList, 99991231)).toEqual([
                '99991231000000_index02.txt',
                '99991231000000_index03.txt',
            ]);
        });
        /* TODO：ファイル名に日付がないデータが混在した場合のテスト追加 */
    });
    // getPairOfSite
    describe('getPairOfSite() >>', (): void => {
        test('配列同士から、サイト名が合致する組合せを取得する', (): void => {
            expect(
                diff.getPairOfSite(testList, ['19000101235959_index03.txt'])
            ).toEqual([
                ['99991231000000_index03.txt', '19000101235959_index03.txt'],
            ]);
        });
        test('完全新規の場合、dummy.txtという空ファイルをペアにする', (): void => {
            expect(
                diff.getPairOfSite(testList, ['19990101235959_index04.txt'])
            ).toEqual([['dummy.txt', '19990101235959_index04.txt']]);
        });
    });
});
