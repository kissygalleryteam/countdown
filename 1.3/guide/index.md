## 综述
Countdown 是一个简洁易用的倒计时组件，计时精度、性能都不差。

## 快速使用

### 初始化组件

    S.use('gallery/countdown/1.3/index', function (S, Countdown) {
        var countdown = new Countdown({
            el: '.countdown'
        });
    })

## API说明

关键配置说明
el: Countdown节点
template: 可以忽略，默认使用el.innerHTML
leftTime: 剩余时间，从服务端输出可以保障准确性
effect: 有 normal, slide, flip 可选

其它配置选项
stopPoint: 也可以输出一个结束的时间戳，此时根据客户端时间计算剩余时间（此时不能输出leftTime，否则使用leftTime）
varRegular: 模板变量正则，有些时候比如不方便使用 ${name} 可以仔细修改，参考本地时间demo
clock: 时钟控制数组，特殊需求时可以修改，里面是三元组：指针名、进制、位数，可参考大于99小时demo

方法
notify(time, callback) 在第xx秒时调用 callback 函数，time单位为s（也可以使用0.1s，不过此时因浏览器的计时器原因不保证100%触发）
