# 测试套件文档

本目录包含完整的测试用例，用于测试 TestEngine 和 BehaviorTree 的各种节点和工作流。

## 目录结构

```
tests/
├── basic/              # 基础控制流节点测试
│   ├── sequence.test.ts
│   ├── selector.test.ts
│   ├── condition.test.ts
│   └── until.test.ts
├── actions/            # Action节点测试
│   ├── setVariable.test.ts
│   ├── assert.test.ts
│   ├── log.test.ts
│   ├── sleep.test.ts
│   └── runScript.test.ts
└── integration/        # 集成测试
    ├── simple-workflow.test.ts
    └── complex-workflow.test.ts
```

## 测试统计

- **测试文件总数**: 11
- **测试用例总数**: 212
- **代码总行数**: 4,479

## 测试覆盖

### 1. 基础节点测试 (tests/basic/)

#### sequence.test.ts (11 测试用例)
测试 Sequence 节点的序列控制流：
- ✓ 所有子节点成功，序列成功
- ✓ 任意子节点失败，序列失败
- ✓ 空序列的行为
- ✓ 嵌套序列
- ✓ 与条件结合使用

#### selector.test.ts (14 测试用例)
测试 Selector 节点的选择器/回退控制流：
- ✓ 第一个子节点成功，选择器成功
- ✓ 所有子节点失败，选择器失败
- ✓ 中间节点成功的情况
- ✓ 回退机制
- ✓ 重试逻辑

#### condition.test.ts (21 测试用例)
测试 Condition 节点的条件判断：
- ✓ 表达式为真
- ✓ 表达式为假
- ✓ 各种比较运算符
- ✓ 逻辑运算符
- ✓ 类型检查
- ✓ 表达式求值错误处理

#### until.test.ts (14 测试用例)
测试 Until 节点的循环控制流：
- ✓ 条件满足时立即成功
- ✓ 循环执行直到条件满足
- ✓ 条件永远不满足时的行为
- ✓ 嵌套循环
- ✓ 状态机模式

### 2. Action测试 (tests/actions/)

#### setVariable.test.ts (22 测试用例)
测试 SetVariable action：
- ✓ 设置各种基础类型（字符串、数字、布尔）
- ✓ 设置复杂类型（对象、数组）
- ✓ 变量覆写
- ✓ 类型变更
- ✓ 特殊字符处理

#### assert.test.ts (27 测试用例)
测试 Assert action：
- ✓ 断言成功场景
- ✓ 断言失败场景
- ✓ 自定义错误消息
- ✓ 复杂断言表达式
- ✓ 工作流验证
- ✓ 前置/后置条件

#### log.test.ts (26 测试用例)
测试 Log action：
- ✓ 基本日志输出
- ✓ 不同日志级别（info, warn, error, debug）
- ✓ 变量插值
- ✓ 特殊字符和多行消息
- ✓ 日志顺序
- ✓ 工作流进度跟踪

#### sleep.test.ts (20 测试用例)
测试 Sleep action：
- ✓ 指定时长延迟
- ✓ 时间精度验证
- ✓ 多个延迟操作
- ✓ 与其他操作组合
- ✓ 循环中的延迟
- ✓ 速率限制模拟

#### runScript.test.ts (30 测试用例)
测试 RunScript action：
- ✓ 基本脚本执行
- ✓ 变量操作
- ✓ 复杂计算
- ✓ 数组操作
- ✓ 对象操作
- ✓ 字符串操作
- ✓ 与控制流集成

### 3. 集成测试 (tests/integration/)

#### simple-workflow.test.ts (16 测试用例)
简单工作流测试：
- ✓ 变量设置 → 断言 → 日志输出
- ✓ 条件分支测试
- ✓ 数据处理工作流
- ✓ 用户注册流程
- ✓ 订单处理流程
- ✓ 配置验证流程
- ✓ 状态机转换
- ✓ 错误恢复

#### complex-workflow.test.ts (11 测试用例)
复杂工作流测试：
- ✓ 嵌套 Sequence 和 Selector
- ✓ Until 循环与重试机制
- ✓ 指数退避重试
- ✓ 轮询机制
- ✓ 批处理
- ✓ 多阶段数据管道
- ✓ 复杂状态机
- ✓ 多层级错误处理
- ✓ 电商结账流程
- ✓ 数据同步与冲突解决

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试文件
```bash
npm test -- tests/basic/sequence.test.ts
```

### 运行特定测试套件
```bash
# 运行基础测试
npm test -- tests/basic/

# 运行Action测试
npm test -- tests/actions/

# 运行集成测试
npm test -- tests/integration/
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

### 监视模式（开发时使用）
```bash
npm run test:watch
```

## 测试架构

所有测试使用以下工具和模式：

- **TestEngine**: 执行测试树的引擎
- **TestTreeBuilder**: 流式 API 构建测试树
- **Jest**: 测试框架和断言库

### 典型测试结构

```typescript
import { TestEngine } from '../../src/control/TestEngine/TestEngine';
import { TestTreeBuilder } from '../../src/control/TestEngine/TestTreeBuilder';

describe('测试套件名称', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  it('应该执行某个功能', async () => {
    // Arrange: 创建测试树
    const tree = TestTreeBuilder.sequence(
      TestTreeBuilder.setVariable('x', 10),
      TestTreeBuilder.assert('x === 10')
    );

    // Act: 运行测试
    const result = await engine.runTest(tree);

    // Assert: 验证结果
    expect(result.success).toBe(true);
    expect(result.variables.x).toBe(10);
  });
});
```

## 测试最佳实践

1. **清晰的测试描述**: 使用描述性的 `it()` 字符串
2. **AAA 模式**: Arrange（准备）、Act（执行）、Assert（断言）
3. **独立性**: 每个测试应该独立运行
4. **完整性**: 验证成功状态、变量值、日志和错误
5. **边界情况**: 包含正常、异常和边界场景

## 覆盖的场景

### 成功路径
- 正常工作流执行
- 所有节点按预期运行
- 数据正确转换和验证

### 失败路径
- 断言失败
- 条件不满足
- 序列中断

### 边界情况
- 空集合
- null/undefined 值
- 极值
- 特殊字符

### 集成场景
- 嵌套控制流
- 循环和迭代
- 错误处理和恢复
- 真实业务场景

## 贡献指南

添加新测试时：

1. 选择合适的目录（basic/actions/integration）
2. 遵循现有的命名约定
3. 使用 AAA 模式编写测试
4. 添加清晰的注释
5. 确保测试独立且可重复
6. 更新本 README 文档

## 许可

与主项目保持一致的 MIT 许可。
