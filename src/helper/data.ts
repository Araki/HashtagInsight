export function snakeToCamel(data: { [key: string]: any }): object {
  const obj: { [key: string]: any } = {};
  Object.keys(data).forEach((key: string) => {
    const camel = key.replace(/_./g, (s) => {
      return s.charAt(1).toUpperCase();
    });
    obj[camel] = data[key];
  });
  return obj;
}

export function camelToSnake(camel: string): string {
  return camel.replace(/([A-Z])/g,
    (str) => {
      return '_' + str.charAt(0).toLowerCase();
    },
  );
}

/**
 * Set区を生成する
 * @param columns 更新カラムと値のobejct
 * @param updatable 更新可能なカラムのリスト
 * @param values bindする値
 * @returns クエリ
 */
export function queryForPatch(columns: any, updatable: string[], values: any[]): string {
  const obj: { [key: string]: any } = columns as object;

  let querySetPart = '';
  let comma = '';
  Object.keys(obj).forEach((key) => {
    if (updatable.indexOf(key) < 0) {
      return;
    }
    querySetPart += ` ${comma}${camelToSnake(key)} = ?`;
    values.push(obj[key]);
    comma = ',';
  });
  return querySetPart;
}
