# Pipeline Templates

此目录包含批量编排功能的预设模板。每个模板都是独立的 JSON 文件。

## 模板结构

每个模板 JSON 文件应包含以下字段：

```json
{
  "name": "模板名称",
  "description": "模板描述",
  "mode": "serial" | "parallel" | "combination",
  "steps": [
    "步骤1的提示词",
    "步骤2的提示词",
    "..."
  ]
}
```

### 字段说明

- **name**: 模板显示名称（必填）
- **description**: 模板功能描述（必填）
- **mode**: 执行模式（必填）
  - `serial`: 串行模式 - 步骤依次执行，每步使用前一步的输出
  - `parallel`: 并行模式 - 所有步骤同时执行，共享初始图片
  - `combination`: 批量组合模式 - 每张图片×每条提示词
- **steps**: 提示词数组（必填）
  - 每个元素是一个字符串，代表一个步骤的提示词

## 现有模板

### 串行模板（Serial）
- **style-transfer.json** - 风格迁移
- **progressive-enhancement.json** - 渐进优化

### 并行模板（Parallel）
- **multi-style-exploration.json** - 多风格探索
- **dataset-generation.json** - 快速炼丹数据集生成

### 批量组合模板（Combination）
- **batch-combination.json** - 批量组合生成

## 如何添加新模板

1. 在此目录下创建新的 JSON 文件，例如 `my-template.json`
2. 按照上述结构编写模板内容
3. 编辑 `src/services/pipelineTemplateService.ts`
4. 在 `TEMPLATE_FILES` 数组中添加新文件路径：
   ```typescript
   const TEMPLATE_FILES = [
     // ... 现有文件
     '/templates/my-template.json'
   ];
   ```
5. 刷新页面即可在界面中使用新模板

## 如何修改现有模板

1. 直接编辑对应的 JSON 文件
2. 修改 `name`、`description`、`mode` 或 `steps` 中的任何内容
3. 保存文件
4. 刷新页面，更改即生效

## 注意事项

- 模板文件必须是有效的 JSON 格式
- 提示词应使用英文以获得最佳效果（Gemini 模型对英文提示词响应更准确）
- 串行模板建议 2-5 个步骤
- 并行模板可以有多个步骤，但注意 API 速率限制
- 所有模板在组件加载时会被缓存到内存中
