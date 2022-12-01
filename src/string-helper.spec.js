import stringHelper from './string-helper.js';
import { describe, expect, it } from 'vitest';

describe('stringHelper', () => {

  describe('getDatabaseNameFromUri', () => {
    const testCases = [
      {
        uri: '', expectedResult: ''
      },
      {
        uri: 'mongodb://root:password123@198.174.21.23:27017', expectedResult: ''
      },
      {
        uri: 'mongodb://root:password123@198.174.21.23:27017/databaseName', expectedResult: 'databaseName'
      },
      {
        uri: 'mongodb://root:password123@198.174.21.23:27017/databaseName?replicaSet=rs01&ssl=false', expectedResult: 'databaseName'
      },
      {
        uri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName', expectedResult: 'databaseName'
      }
    ];

    testCases.forEach(({ uri, expectedResult }) => {
      it(`should return '${expectedResult}' from '${uri}'`, () => {
        const result = stringHelper.getDatabaseNameFromUri(uri);
        expect(result).toBe(expectedResult);
      });
    });
  });
});
