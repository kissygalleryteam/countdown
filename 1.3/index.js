/**
 * @fileoverview 倒计时组件
 * @author jide<jide@taobao.com>
 * @module Countdown
 *
 *
 * [+]new feature  [*]improvement  [!]change  [x]bug fix
 *
 * [*] 2013-07-10
 *     bump version to 1.3
 * [*] 2012-04-26
 *     移除watchman，以及与真实时间有关的逻辑。修正notify无效的bug
 * [x] 2011-04-18 16:35
 *     修复初始之为0时可能出现倒计时为负数的bug by xixia.sm
 *     {{{ value = value < 0 ? 0 : value; }}}
 */

KISSY.add(function (S, Node, Base, JSON, Timer, Effect) {
    var EVENT_AFTER_PAINT = 'afterPaint';

    /**
     * 请修改组件描述
     * @class Countdown
     * @constructor
     * @extends Base
     */
    function Countdown(config) {
        // factory or constructor
        if (!(this instanceof Countdown)) {
            return new Countdown(config);
        }

        config.el = S.one(config.el);
        if (!config.el) return;

        var cfg = config.el.attr('data-config');
        if (cfg) {
            cfg = JSON.parse(cfg.replace(/'/g, '"'));
            config = S.merge(cfg, config);
        }

        //调用父类构造函数
        Countdown.superclass.constructor.call(this, config);

        this._init();
    }

    S.extend(Countdown, Base,
        /** @lends Countdown.prototype*/{
            /**
             * 初始化
             * @private
             */
            _init: function () {//{{{
                var me = this;
                var el = me.get('el');

                // 初始化时钟.
                var hands = [];
                /**
                 * 指针结构
                 * hand: {
                 *   type: string,
                 *   value: number,
                 *   lastValue: number,
                 *   base: number,
                 *   radix: number,
                 *   bits: number,
                 *   node: S.Node
                 * }
                 */
                me.hands = hands;
                me.frequency = 1000;
                me._notify = [];

                // 分析markup
                var tmpl = el.html();
                var varRE = me.get('varRegular');
                varRE.lastIndex = 0;
                el.html(tmpl.replace(varRE, function (str, type) {
                    // 时钟频率校正.
                    if (type === 'u' || type === 's-ext') {
                        me.frequency = 100;
                    }

                    // 生成hand的markup
                    var content = '';
                    if (type === 's-ext') {
                        hands.push({type: 's'});
                        hands.push({type: 'u'});
                        content = me._html('', 's', 'handlet') +
                            me._html('.', '', 'digital') +
                            me._html('', 'u', 'handlet');
                    } else {
                        hands.push({type: type});
                    }

                    return me._html(content, type, 'hand');
                }));

                // 指针type以外属性(node, radix, etc.)的初始化.
                var clock = me.get('clock');
                S.each(hands, function (hand) {
                    var type = hand.type,
                        base = 100, i;

                    hand.node = el.one('.hand-' + type);

                    // radix, bits 初始化.
                    for (i = clock.length - 3; i > -1; i -= 3) {
                        if (type === clock[i]) {
                            break;
                        }

                        base *= clock[i + 1];
                    }
                    hand.base = base;
                    hand.radix = clock[i + 1];
                    hand.bits = clock[i + 2];
                });

                me._getLeft();
                me._reflow();

                // bind reflow to me.
                var _reflow = me._reflow;
                me._reflow = function () {
                    return _reflow.apply(me, arguments);
                };
                Timer.add(me._reflow, me.frequency);

                // 显示时钟.
                el.show();
            },//}}}
            /**
             * 获取倒计时剩余帧数
             */
            _getLeft: function () {//{{{
                var left = this.get('leftTime') * 1000;
                var end = this.get('stopPoint');        // 这个是UNIX时间戳，毫秒级
                if (!left && end) {
                    left = end - S.now();
                }

                this.left = left - left % this.frequency;
            },//}}}
            /**
             * 更新时钟
             */
            _reflow: function (count) {//{{{
                count = count || 0;

                var me = this;
                me.left = me.left - me.frequency * count;

                // 更新hands
                S.each(me.hands, function (hand) {
                    hand.lastValue = hand.value;
                    hand.value = Math.floor(me.left / hand.base) % hand.radix;
                });

                // 更新时钟.
                me._repaint();

                // notify
                if (me._notify[me.left]) {
                    S.each(me._notify[me.left], function (callback) {
                        callback.call(me);
                    });
                }

                // notify 可能更新me.left
                if (me.left < 1) {
                    Timer.remove(me._reflow);
                }

                return me;
            },//}}}
            /**
             * 重绘时钟
             * @private
             */
            _repaint: function () {//{{{
                Effect[this.get('effect')].paint.apply(this);

                this.fire(EVENT_AFTER_PAINT);
            },//}}}
            /**
             * 把值转换为独立的数字形式
             * @private
             * @param {number} value
             * @param {number} bits
             */
            _toDigitals: function (value, bits) {//{{{
                value = value < 0 ? 0 : value;

                var digitals = [];

                // 把时、分、秒等换算成数字.
                while (bits--) {
                    digitals[bits] = value % 10;

                    value = Math.floor(value / 10);
                }

                return digitals;
            },//}}}
            /**
             * 生成需要的html代码，辅助工具
             * @private
             * @param {string|Array.<string>} content
             * @param {string} className
             * @param {string} type
             */
            _html: function (content, className, type) {//{{{
                if (S.isArray(content)) {
                    content = content.join('');
                }

                switch (type) {
                    case 'hand':
                        className = type + ' hand-' + className;
                        break;
                    case 'handlet':
                        className = type + ' hand-' + className;
                        break;
                    case 'digital':
                        if (content === '.') {
                            className = type + ' ' + type + '-point ' + className;
                        } else {
                            className = type + ' ' + type + '-' + content + ' ' + className;
                        }
                        break;
                }

                return '<s class="' + className + '">' + content + '</s>';
            },//}}}
            /**
             * 倒计时事件
             * @param {number} time unit: second
             * @param {Function} callback
             */
            notify: function (time, callback) {//{{{
                time = time * 1000;
                time = time - time % this.frequency;

                var notifies = this._notify[time] || [];
                notifies.push(callback);
                this._notify[time] = notifies;

                return this;
            }//}}}
        }, {
            ATTRS: /** @lends Countdown*/{
                el: {
                },
                // unix时间戳，单位应该是毫秒！
                stopPoint: {
                },
                leftTime: {
                    value: 0
                },
                template: {
//                    value: '${h}时${m}分${s-ext}秒'
                },
                varRegular: {
                    value: /\$\{([\-\w]+)\}/g
                },
                clock: {
                    value: ['d', 100, 2, 'h', 24, 2, 'm', 60, 2, 's', 60, 2, 'u', 10, 1]
                },
                effect: {
                    value: 'normal'
                }
            }
        });

    return Countdown;
}, {requires: ['node', 'base', 'json', './timer', './effect', './index.css']});
