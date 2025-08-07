module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型必须小写
    'type-case': [2, 'always', 'lower-case'],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 主题必须以.结尾
    'subject-full-stop': [2, 'never', '.'],
    // 主题最大长度
    'subject-max-length': [2, 'always', 100],
    // 正文最大长度
    'body-max-line-length': [2, 'always', 100],
    // 页脚最大长度
    'footer-max-line-length': [2, 'always', 100],
  },
};
