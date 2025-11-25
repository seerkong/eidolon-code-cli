public class DataWriteRuntime {
    // 其他域的runtime实例 start
    private DataReadRuntime readRuntime;
    private PermissionRuntime permissionRuntime;
    // 其他域的runtime实例 end

    // 逻辑依赖 start
    private DataWriteSupportMesh supportMesh;	// 以接口interface形式提供的固定依赖
    private DataWriteCallback callback;	// 零散的逻辑依赖合集，有强依赖和可选依赖之分。对象中的字段允许为空，表示可选的依赖函数回调
    // 逻辑依赖 end

    // 引擎配置 start
    @Default
    private DataWriteOptions options = DataWriteOptions.builder().build();	// 零散的，已经计算好的值，bool, number, string
    @Default
    private DataWriteConfigProviders configProviders = DataWriteConfigProviders.builder().build();	// 对象中的每个字段，存放的是引擎执行过程中，需要动态主动调用一下获取最新配置的函数
    // 引擎配置 end

    // 外部上下文 start
    // 【外部产生】【值对象】【不可变】在一次外部调用过程中，本模块将输入转换成的内部不可变参数
    @Default
    private DataWriteOuterCtx outerCtx = DataWriteOuterCtx.builder().build();
    // 外部上下文 end

    // 内部上下文 start
    // 【内部产生】【值对象】【可变】在一次外部调用过程中，在内存中进行记录的数据。
    @Default
    private DataWriteInnerCtx innerCtx = DataWriteInnerCtx.builder().build();
    // 【内部产生】【值对象】【可变】在一次外部调用过程中，如果出现了错误，错误相关的数据存储在这个上下文中
    @Default
    private DataWriteErrorCtx errorCtx = DataWriteErrorCtx.builder().build();
    @Default
    private TransactionCtx transactionCtx = new TransactionCtx();
    // 内部上下文 end

    // 数据镜像 start
    // ImmutableSnapshot： 【其他模块产生】【实体、值对象】【不可变】在整个被调用过程中，依赖的需要加载到内存中的持久化存储数据。
    @Default
    private DataWriteImmutableSnapshot immutableSnapshot = DataWriteImmutableSnapshot.builder().build();
    // MutableSnapshot： 【本模块产生】【实体、值对象】【可变】在整个被调用过程中，会产生数据变化的，需要从持久化存储加载和保存的数据, 和再次加工计算得到的数据
    @Default
    private DataWriteMutableSnapshot mutableSnapshot = DataWriteMutableSnapshot.builder().build();
    // 数据镜像 end
}
